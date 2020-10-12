/**
 * 开始同步 
 */
function start_sync(sync_kemu){
	if(!islogin()){
		console.log('未登录，不同步');
		sendEvent('refresh_question',{});//刷新题库使用记录
		return;
	}
	sql = 'SELECT * FROM sync_date_recode WHERE kemu = "'+sync_kemu+'" AND sync_date = "'+new Date().Format('yyyy-MM-dd') +'" AND learner_id = '+getUserId();
	db.selectSql({
        name:'drivingApp',
        sql:sql
    },function(ret,err){
    	if(ret&&ret.status){
    		if(ret.data.length > 0){
    			//如果有同步记录，那么不同步
    			console.log('当天已同步');
    			sendEvent('refresh_question',{});//刷新题库使用记录
    		}else{
    			//当天无同步记录，直接同步
    			sync_question_recode(sync_kemu);
    		}
    	}else{
    		log('获取同步记录失败',err);
    		alert_msg('获取同步记录失败');
    	}
    });
}


/**
 * 同步做题记录 （k）
 */
function sync_question_recode(sync_kemu){
	defaultload('同步中...');
	url = 'api/question/getQuestionRecode';
	params = {
		learnerId:getUserId(),
		kemu:sync_kemu
	}
	
	ajax_Request(url, 'get', 'json', params, function(ret,err){
		if(ret&&ret.code == 0){
			log('云端做题数据',ret.questionRecodes);
			var questionRecodes = ret.questionRecodes;
			if(questionRecodes.length > 0){
				//启用事务同步题库
        		db.transaction({
                    name:'drivingApp',
                    operation:'begin'
                },function(ret,err){
                	log('启动事务成功',ret);
                	if(ret.status){
                		//先查询本地做题记录，与云端下载的数据作对比，去除那些比本地版本号低的云端数据
                		db.selectSql({
                            name:'drivingApp',
                            sql:'SELECT r.* FROM cm_question_recode r LEFT JOIN cm_question q ON r.question_id = q.question_id WHERE r.learner_id = ' + getUserId() + ' and q.kemu = "'+sync_kemu+'"'
                        },function(ret,err){
                        	if(ret&&ret.status){
                        		//清除比本地版本号低的云端数据
                        		//log('处理前的数据',questionRecodes);
                        		questionRecodes = clearVersionLow(questionRecodes,ret.data);
                        		//log('处理后的数据',questionRecodes);
	                    		//执行插入语句
	                    		for(var i=0;i<questionRecodes.length;i++){
	                    			if(questionRecodes[i].is_should_update != 'false'){
										sql = "REPLACE INTO cm_question_recode (question_id,learner_id,belong_bank_type,right_num,wrong_num,learner_option_code,is_right,insert_dt,update_dt,local_version,version) ";
										sql += "VALUES('"+questionRecodes[i].questionId+"',";
										sql += "'"+questionRecodes[i].learnerId+"',";
										sql += "'"+questionRecodes[i].belongBankType+"',";
										sql += "'"+questionRecodes[i].rightNum+"',";
										sql += "'"+questionRecodes[i].wrongNum+"',";
										sql += "'"+questionRecodes[i].learnerOptionCode+"',";
										sql += "'"+questionRecodes[i].isRight+"',";
										sql += "'"+questionRecodes[i].insertDt+"',";
										sql += "'"+questionRecodes[i].updateDt+"',";
										sql += "'"+questionRecodes[i].localVersion+"',";
										sql += "'"+questionRecodes[i].version+"')";
										db.executeSql({
									        name:'drivingApp',
									        sql:sql
								        },function(ret,err){
								        	if(ret&&ret.status){
								        	}
								        });
	                    			}
								}
	                    		db.transaction({
	                                name:'drivingApp',
	                                operation:'commit'
	                            },function(ret,err){
	                            	if(ret.status){
	                            		sendEvent('refresh_question',{});//刷新题库使用记录
	                            		//做题记录同步到本地成功，进行下一步
	                            		uploadQuestionRecode(sync_kemu);
	                            		console.log('事务执行成功');
	                            	}else{
	                            		alert_msg('结束云端同步失败');
	                            	}
	                            });
                        	}else{
                        		//获取本地做题记录失败
                        		alert_msg('获取本地做题记录失败');
                        	}
                        });
                	}else{
                		api.hideProgress();
                		alert_msg('启动云端同步失败');
                	}
                });
			}else{
				//无云端数据，直接进下一步
				sendEvent('refresh_question',{});
				uploadQuestionRecode(sync_kemu);
			}
		}else{
			api.hideProgress();
			alert_msg('获取云端数据失败');
		}
	});
}

/**
 * 清除比本地版本号低的云端数据
 */
function clearVersionLow(questionRecodes,localQuestionRecode){
	//log('本地数据',localQuestionRecode);
	for(var i=0;i<questionRecodes.length;i++){
		for(var j=0;j<localQuestionRecode.length;j++){
			if(questionRecodes[i].questionId == localQuestionRecode[j].question_id){
				if(parseInt(questionRecodes[i].version) <= parseInt(localQuestionRecode[j].local_version)){
					//如果云端版本号低于或等于本地版本号，那么不能更新本地
					questionRecodes[i].is_should_update = 'false';
				}
			}
		}
	}
	return questionRecodes;
}

//原始做题记录json文件
var recode_path = 'fs://uploadFile/kemu_recode.json';
//做题记录json文件
var recode_question_path = 'fs://uploadFile/kemu_question_recode.json';

/**
 * 获取做题记录
 */
function uploadQuestionRecode(sync_kemu){
	sql = "select DISTINCT ";
	sql += "r.question_id question_id, ";
	sql += "r.learner_id learner_id, ";
	sql += "r.belong_bank_type belong_bank_type, ";
	sql += "r.right_num right_num, ";
	sql += "r.wrong_num wrong_num, ";
	sql += "r.learner_option_code learner_option_code, ";
	sql += "r.is_right is_right, ";
	sql += "r.insert_dt insert_dt, ";
	sql += "r.update_dt update_dt, ";
	sql += "r.local_version local_version, ";
	sql += "r.local_version version ";
	sql += "from cm_question_recode r left join cm_question q on q.question_id = r.question_id ";
	sql += "where r.learner_id = " + getUserId() + " and q.kemu = '"+sync_kemu+"' and r.local_version > r.version";
	db.selectSql({
        name:'drivingApp',
        sql:sql
    },function(ret,err){
    	log('做题记录----------',ret.data);
    	if(ret&&ret.status){
    		if(ret.data.length > 0){
        		//创建文件
        		var jsonRecode = {
        			studyRecode:ret.data
        		}
        		existFile(jsonRecode,recode_question_path,sync_kemu);
    		}else{
    			api.hideProgress();
    			sendEvent('sync_success_none',{});
    			alert_msg('已同步');
    		}
    	}else{
    		log('获取做题记录失败',err);
    	}
    });
}

/**
 * 获取做题原始记录并上传到阿里云日志
 */
function uploadRecode(sync_kemu){
	sql = 'SELECT DISTINCT r.learner_id,';
	sql += 'r.question_id question_id,';
	sql += 'r.belong_bank_type belong_bank_type,';
	sql += 'r.learner_option_code learner_option_code,';
	sql += 'r.right_option_code right_option_code,';
	sql += 'r.is_right is_right,';
	sql += 'r.insert_dt r_inset_dt,';
	sql += 'q.type type,';
	sql += 'bank_type,';
	sql += 'question_type,';
	sql += 'tags,';
	sql += 'kemu,';
	sql += 'chapter,';
	sql += 'difficulty,';
	sql += 'check_point,';
	sql += 'is_vip,';
	sql += 'is_cal_vip ';
	sql += 'FROM cm_recode r ';
	sql += 'LEFT JOIN cm_question q ON q.question_id = r.question_id ';
	sql += 'WHERE q.kemu = "' + sync_kemu + '" AND r.learner_id = ' + getUserId();
	db.selectSql({
        name:'drivingApp',
        sql:sql
    },function(ret,err){
    	if(ret&&ret.status){
    		if(ret.data.length > 0){
        		//创建文件
        		var jsonRecode = {
        			studyRecode:ret.data
        		}
        		existFile(jsonRecode,recode_path,sync_kemu);
    		}else{
    			console.log('无原始做题数据');
    			uploadRecodeFile(sync_kemu);
    		}
    	}else{
    		log('获取做题记录失败',err);
    	}
    });
}
function existFile(data,json_path,sync_kemu){
	fs.exist({
        path:json_path
    },function(ret,err){
    	if(ret&&ret.exist){
    		openFile(data,json_path,sync_kemu);
    	}else{
    		createFile(data,json_path,sync_kemu);
    	}
    });
}

//创建文件
function createFile(data,json_path,sync_kemu){
	fs.createFile({
        path: json_path
    },function(ret,err){
    	if(ret&&ret.status){
    		openFile(data,json_path,sync_kemu);
    	}else{
    		alert_msg('读取文件失败');
    	}
    });
}

//打开文件
function openFile(data,json_path,sync_kemu){
	
	fs.open({
        path: json_path,
        flags: 'read_write'
    },function(ret,err){
    	if(ret&&ret.status){
    		writeFile(data,ret.fd,json_path,sync_kemu);
    	}else{
    		alert_msg('读取文件失败');
    	}
    });
}

//写入文件
function writeFile(file_data,fd,json_path,sync_kemu){
	fs.write({
        fd:fd,
        data:JSON.stringify(file_data),
        offset:0,
        overwrite:true
    },function(ret,err){
    	log('写入文件',ret);
    	if(ret&&ret.status){
    		if(json_path == 'fs://uploadFile/kemu_question_recode.json'){
    			//如果是第一步（同步的是做题记录），那么继续读取原始做题记录
    			uploadRecode(sync_kemu);
    		}else{
    			//如果做题记录和原始记录都读取完毕，那么上传到云端
        		uploadRecodeFile(sync_kemu);
    		}
    	}else{
    		alert_msg('写入文件失败');
    	}
    });
}

/**
 * 选择科目一题库
 */
function selectItemBank(){

}

/**
 * 上传学习记录文件 到日志系统
 */
function uploadRecodeFile(sync_kemu){
	getPhoneToken(function(ret){
		url = 'api/question/uploadQuestionReocode?kemu='+sync_kemu;
		api.ajax({
			url : common_url + url,
			method : 'post',
			tag:url,
			timeout:100,
			dataType : 'json',
			headers : {
				"appToken":ret.appToken
			},
			data: {
				files:{
					'recode_file':recode_path,
					'question_recode_file':recode_question_path
				}
			}
		}, function(ret, err) {
			//log('文件上传',ret);
			if(ret&&ret.code == 0){
				alert_msg('同步成功');
				sendEvent('sync_success',{});
				//自己本地的版本号覆盖云端版本号，这样的话下次就不会再次提交了
				sync_local_version(sync_kemu);
				//清除原始记录
				deteleFile(sync_kemu);
				//记录同步时间，每天只同步一次
				noteSyncRecode(sync_kemu);
			}else{
				api.hideProgress();
				alert_msg('同步失败');
			}
		});
	});
}

/**
 * 自己本地的版本号覆盖云端版本号，这样的话下次就不会再次提交了
 */
function sync_local_version(sync_kemu){
	sql = 'UPDATE cm_question_recode SET version = local_version WHERE local_version > version AND question_id IN (select question_id from cm_question where kemu = "'+sync_kemu+'") AND learner_id = ' + getUserId();
	console.log('同步本地版本sql'+sql);
	db.executeSql({
        name:'drivingApp',
        sql:sql
    },function(ret,err){
    	if(ret&&ret.status){
    		console.log('同步本地版本成功');
    	}else{
    		console.log('同步本地版本失败');
    	}
    });
}

//删除本地做题原始记录
function deteleFile(sync_kemu){
	sql = 'DELETE FROM cm_recode WHERE question_id IN (select question_id from cm_question where kemu = "'+sync_kemu+'") AND learner_id = ' + getUserId();
	db.executeSql({
        name:'drivingApp',
        sql:sql
    },function(ret,err){
    	if(ret&&ret.status){
    		console.log('删除原始记录成功');
    	}else{
    		console.log('本地题库删除失败'+JSON.stringify(err));
    	}
    });
}

/**
 * 记录同步日志，每日只能有一次
 */
function noteSyncRecode(sync_kemu){
	sql = 'INSERT INTO sync_date_recode(learner_id,kemu,sync_date,sync_dt)VALUES('+getUserId()+',"'+sync_kemu+'","'+new Date().Format('yyyy-MM-dd')+'","'+new Date().Format('yyyy-MM-dd HH:mm:ss')+'")';
	db.executeSql({
        name:'drivingApp',
        sql:sql
    },function(ret,err){
    	if(ret&&ret.status){
    		console.log('记录同步每日日志成功');
    	}else{
    		console.log('记录同步每日日志失败'+JSON.stringify(err));
    	}
    });
}

//删除本地做题记录（测试）
function deteleQuestionFile(){
	sql = 'DELETE FROM cm_question_recode WHERE learner_id = ' + getUserId();
	db.executeSql({
        name:'drivingApp',
        sql:sql
    },function(ret,err){
    	if(ret&&ret.status){
    		alert_msg('删除成功');
    	}else{
    		alert('本地题库删除失败'+JSON.stringify(err));
    	}
    });
}

function getLocalDb(){
	db.selectSql({
	    name:'drivingApp',
	    sql:'SELECT * FROM cm_question_recode'
    },function(ret,err){
    	log('本地题库与人关系',ret.data);
    });
	db.selectSql({
	    name:'drivingApp',
	    sql:'SELECT * FROM cm_recode'
    },function(ret,err){
    	log('本地做题记录',ret.data);
    });
    db.selectSql({
	    name:'drivingApp',
	    sql:'SELECT * FROM cm_question'
    },function(ret,err){
    	log('本地题目',ret.data);
    });

}
//（测试）
function deleteRecode(){
	db.executeSql({
        name:'drivingApp',
        sql:'DELETE FROM cm_recode'
    },function(ret,err){
    	if(ret.status){
    		alert_msg('清除做题记录成功');
    	}else{
    		alert_msg(JSON.stringify(err));
    	}
    });
}

//（测试）
function deleteQuestionRecode(){
	db.executeSql({
        name:'drivingApp',
        sql:'DELETE FROM cm_question_recode'
    },function(ret,err){
    	if(ret.status){
    		alert_msg('清除题目关系成功');
    	}else{
    		alert_msg(JSON.stringify(err));
    	}
    });
}

/**
 * 获取做题记录 （测试）
 */
function getQuestionFile(){
	sql = "select DISTINCT ";
	sql += "r.question_id, ";
	sql += "r.learner_id, ";
	sql += "r.belong_bank_type, ";
	sql += "r.right_num, ";
	sql += "r.wrong_num, ";
	sql += "r.learner_option_code, ";
	sql += "r.is_right, ";
	sql += "r.insert_dt, ";
	sql += "r.update_dt, ";
	sql += "r.local_version, ";
	sql += "r.local_version version ";
	sql += "from cm_question_recode r left join cm_question q on q.question_id = r.question_id ";
	sql += "where r.learner_id = " + getUserId() + " and q.kemu = '036001'";
	db.selectSql({
        name:'drivingApp',
        sql:sql
    },function(ret,err){
    	log('获取做题记录',ret);
    	log('获取做题记录',err);
    });
}

/**
 * 获取同步记录数据（测试） 
 */
function syncRecode(sync_kemu){
	sql = 'SELECT * FROM sync_date_recode WHERE kemu = "'+sync_kemu+'" AND learner_id = '+getUserId();
	db.selectSql({
        name:'drivingApp',
        sql:sql
    },function(ret,err){
    	log('获取同步记录',ret);
    });
}

/**
 * 清除同步记录数据 （测试） 
 */
function clearSyncRecode(sync_kemu){
	sql = 'DELETE FROM sync_date_recode WHERE kemu = "'+sync_kemu+'" AND learner_id = '+getUserId();
	db.executeSql({
        name:'drivingApp',
        sql:sql
    },function(ret,err){
    	log('删除同步记录',ret);
    });
}

/**
 * 清除做题模式缓存 （测试）
 */
function clearModel(){
	api.removePrefs({
	    key: 'is_back_question'
	});
	api.removePrefs({
	    key: 'is_close_book'
	});
	api.removePrefs({
	    key: 'is_close_open'
	});
	alert_msg('清除成功');
}


//获取最新题库
function getNewestQuestion(kemu){
	url = 'api/question/version';
	params = {
		kemu:kemu
	}
	if(islogin()){
		params.learnerId = getUserId();
	}
	ajax_Request(url, "get", "json", params, function(ret,err){
		log('最新题库版本',ret);
		if(ret&&ret.code == 0){
			checkVersion(ret.question.version,kemu);//拿服务器最新题库版本和本地题库版本做校验
		}else{
			alert_msg('获取最新题库版本号失败');
		}
	});
}

//拿服务器最新题库版本和本地题库版本做校验
function checkVersion(serverVersion,kemu){
	sql = 'SELECT version FROM cm_question WHERE kemu = "' + kemu + '" ORDER BY version DESC LIMIT 0,1';
	db.selectSql({
        name:'drivingApp',
        sql:sql
    },function(ret,err){
    	log('本地版本号',ret);
    	if(ret&&ret.status){
    		if(ret.data.length > 0){
    			if(serverVersion != ret.data[0].version){//版本不一致，以服务器的为准
    				openDownloadVision(serverVersion,kemu);//下载题库
    			}else{
    				console.log('题库已最新');
    				//题库如果最新，那么直接去同步
    				start_sync(kemu);
    			}
    		}else{
    			openDownloadVision(serverVersion,kemu);//下载题库
    		}
    	}else if(err){
    		sendErrorLog('科目一比较版本失败',JSON.stringify(err));
			//数据库出现异常，重新加载数据库
			openMessage('温馨提示', '检测到题库版本较低，请手动更新', '更新', '', 'delete_db("'+kemu+'")', '', null);
    	}
    });
};

//打开题库下载界面
function openDownloadVision(serverVersion,kemu){
	api.openFrame({
        name: 'download_progress_frm',
        url: '../common/question/download_progress_frm.html',
        bgColor: 'rgba(0,0,0,0.1)',
        rect: {
            x: 0,
            y: 0,
            w: 'auto',
            h: api.winHeight
        },
        bounces: false,
        pageParam:{
        	serverVersion:serverVersion,
        	kemu:kemu,
        	winName:api.winName,
        	frameName:api.frameName
        },
        softInputBarEnabled:true,
        softInputMode:'resize'
    });
}

//删除DB
function delete_db(kemu){
	fs.rmdir({
	    path: 'fs://' + db_name
	}, function(ret, err) {
	    if (ret.status) {
	        copy_db(kemu);
	    }else if(err){
	    	if(err.msg.indexOf('not exist') != -1){
	    		copy_db(kemu);
	    	}else{
		    	sendErrorLog("删除数据库错误：",JSON.stringify(err),1);
		    	copy_db(kemu);
	    	}
	    } else {
	        console.log("删除DB失败"+JSON.stringify(err));
	    }
	});
}

//复制DB文件到手机存储空间
function copy_db(kemu){
	fs.copyTo({
	    oldPath: 'widget://res/db/' + db_name,
	    newPath: 'fs://'
	}, function(ret, err) {
	    if (ret.status) {
	        console.log("copyDB文件成功");
	        open_db(kemu);
	    }else if(err){
	    	sendErrorLog("复制数据库错误：",JSON.stringify(err),1);
	    } else {
	        console.log("copyDB文件失败"+JSON.stringify(err));
	    }
	});
}

//打开数据库
function open_db(kemu){
	db.openDatabase({
	    name: 'drivingApp',
	    path: 'fs://' + db_name
	}, function(ret, err) {
	    if (ret.status) {
	        log('db打开成功',kemu);
	        getNewestQuestion(kemu);
	    }else if(err){
	    	sendErrorLog("打开数据库错误：",JSON.stringify(err),1);
	    } else {
	        log('db打开失败',err);
	    }
	});
}
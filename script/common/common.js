
/**
 * app请求地址
 */
//var common_url = 'http://47.111.23.192:81/dlaBack/';
var common_url = 'https://dla.mohan-tech.com/dlaBack/';
//var common_url = 'http://47.111.145.197:8180/dlaBack/';
//var common_url = 'http://192.168.2.143/';
//var common_url = 'http://192.168.1.131/';
/**
 * 文件请求地址
 */
var file_common_url = 'https://file.mohan-tech.com/fileCenter/';
//var file_common_url = 'http://47.111.145.197:8480/fileCenter/';

/**
 * 阿里ossBucket
 */
//var AliOssBucket = 'drivinghometest';
var AliOssBucket = 'jiakaozhijia';

/**
 * oss资源请求地址
 */                                                                  
var file_load_url = file_common_url + 'api/file/getFileAuth?bucketName='+AliOssBucket+'&fileName=';

/**
 * 第三方服务地址 即使测试也要用正式地址，不然生产环境的人脸识别就GG了
 */
var third_url = "https://thirdback.mohan-tech.com/thirdBack/";

//请求地址
var url = "";

//请求参数
var params;

//数据库名称
var db_name = 'drivingQuestion_v9.db';

/**
 * 获取手机接口令牌token
 */
var appSecket = 'FFTnC0D4Rmh6SSUueXUC3nvl2wjIuQN2HBRnxsYRJi1mKcAfKb7lxpVnoyhrOhAp';
var publicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAufrGU8CBWfiduoVV+0OgfAWCk+mhsVpeF4T8J0UZyUhBeEQique7bswORTQtx+MmgNfJTA4s0hfah9KOTB4HIC/8UdJFNzqzUKUsW118LK7fi4sP/TDc1jBpjoVfip1pNJSlvq2Khi54NFy3CZGtsHUuK+4X80oYjSyu3mPKrAyN+cU2j25VSaQCqujytboyglrZs5o+20ewaCFF1S2XHVn4YjQgQ27B1XWIWXTErxy0UjSKEYqr+FjMXAdXfZTrpokA/XMCNWYCwSX0XQ7PdvYDKFv16lxit034sxrWXgjJR3RFZ86dLRQpi8ODWym85ST46cECxI2yn3pdAD4xyQIDAQAB';
function getPhoneToken(func){
	//待SHA256加密的的字符串
	var timestamp = new Date().getTime();
	var str = 'appId='+api.appId+'&&appSecket='+ appSecket + '&&timestamp=' + timestamp;
	//console.log('原文'+str);
	var sha256_encrypt = sha256_digest(str).toUpperCase();
	//console.log('SHA256加密后'+sha256_encrypt);
	var encrypt = new JSEncrypt();
	encrypt.setPublicKey(publicKey);
	var rsa2048_encrypt = encrypt.encrypt(sha256_encrypt + '.' + timestamp);
	console.log('RSA2048加密后'+rsa2048_encrypt);
	//加密后的rsa2048_encrypt作为凭证code传到后台
	defaultload('校验身份中...');
	api.ajax({
		url : common_url + 'api/auth/get-app-token?code=' + rsa2048_encrypt,
		method : 'get',
		timeout: 100,
		dataType : 'json'
	}, function(ret, err) {
		api.hideProgress();
		func(ret,err);
	});
}

/**
 * ajax共同调用
 */
function ajax_Request(url, method, type, params, callBack) {
	//log('请求参数：',params);
	var appToken = $api.getStorage('appToken');
	if(method == "get"){
		//console.log(Base64.encode(JSON.stringify(params)));
		api.ajax({
			url : common_url + url + '?params=' + Base64.encode(JSON.stringify(params)),
			method : method,
			tag:url,//为方便，全部统一
			timeout:100,
			headers : {
				"appToken":appToken
			},
			dataType : type
		}, function(ret, err) {
			if(ret){
				if(ret.code != -2){
					//只要接口通过后台服务器验证就正常进行
					callBack(ret, err);
				}else{
					//重新获取token
					console.log('重新获取token');
					getPhoneToken(function(ret,err){
						//如果这里还是调用ajax_Request方法那么有可能会陷入死循环，所以只获取一次token
						if(ret){
							if(ret.code == 0){
								//刷新手机令牌
								$api.setStorage('appToken',ret.appToken);
								api.ajax({
									url : common_url + url + '?params=' + Base64.encode(JSON.stringify(params)),
									method : method,
									tag:url,//为方便，全部统一
									timeout:100,
									headers : {
										"appToken":ret.appToken
									},
									dataType : type
								}, function(ret, err) {
									callBack(ret, err);
								});
							}else{
								alert_msg(ret.msg);
							}
						}else{
							alert_msg('获取手机令牌失败');
						}
					});
				}
			}else{
				alert_msg('服务器繁忙，请稍后再试~~');
			}
		});
	}else{
		api.ajax({
			url : common_url + url,
			method : method,
			tag:url,//为方便，全部统一
			timeout:30,
			dataType : type,
			headers : {
				"Content-Type" : "application/json",
				"appToken":appToken
			},
			data: {
				body:params
			}
		}, function(ret, err) {
			if(ret){
				if(ret.code != -2){
					//只要接口通过后台服务器验证就正常进行
					callBack(ret, err);
				}else{
					//重新获取token
					console.log('重新获取token');
					getPhoneToken(function(ret,err){
						//如果这里还是调用ajax_Request方法那么有可能会陷入死循环，所以只获取一次token
						if(ret){
							if(ret.code == 0){
								//刷新手机令牌
								$api.setStorage('appToken',ret.appToken);
								api.ajax({
									url : common_url + url,
									method : method,
									tag:url,//为方便，全部统一
									timeout:30,
									dataType : type,
									headers : {
										"Content-Type" : "application/json",
										"appToken":ret.appToken
									},
									data: {
										body:params
									}
								}, function(ret, err) {
									callBack(ret, err);
								});
							}else{
								alert_msg(ret.msg);
							};
						}else{
							alert_msg('获取手机令牌失败');
						}
					});
				}
			}else{
				alert_msg('服务器繁忙，请稍后再试');
			}
		});
	}
}

/**
 * 敏感词过滤
 */
function sensitiveWords(param,func){
  	$.ajax({
    	url:third_url + 'api/testExamine/getText',
    	type:'post',
    	dataType:'json',
    	data:{
      		content:param
    	},
    	headers:{
      		"Content-Type":"application/x-www-form-urlencoded"
		},
    	success:function(ret){
      		func(ret)
    	},
		error:function(err){
		  	func(err)
    	}
  	})
}

/**
 * 发送验证码
 */
function sendMessage(params,func){
	api.ajax({
		url : third_url + 'api/msg',
		method : 'post',
		tag:url,//为方便，全部统一
		timeout:30,
		dataType : 'json',
		headers : {
			"Content-Type" : "application/json"
		},
		data: {
			body:params
		}
	}, function(ret, err) {
		func(ret, err);
	});
}

/**
 * 上传文件
 */
function file_upload(url, method, type, filePath, param, callBack){
	console.log('上传地址url'+decodeURIComponent(url));
	api.ajax({
		url : decodeURIComponent(url),
		method : 'PUT',
		timeout:900,
		report:true,
		charset:'utf-8',
		dataType : type,
		returnAll:true,
		headers : {
			"Content-Type" : "application/octet-stream"
		},
		data: {
			stream:filePath
		}
	}, function(ret, err) {
		callBack(ret, err ,param);
	});
}

/**
 * 获取文件上传权限
 */
function getUploadFilePower(params,callBack){
	api.ajax({
		url : file_common_url + 'api/file/auth?bucketName=' + params.bucketName + '&fileNum=' + params.fileNum + '&fileType=' + params.fileType,
		method : 'get',
		timeout:30,
		dataType : 'json'
	}, function(ret, err) {
		callBack(ret, err);
	});
}

/**
 * 获取字典表
 */
function getDictionary(code,func){
	defaultload();
	url = 'api/dictionary';//获取性别信息，通过字典表
	params = {
		codes:code
	}
	ajax_Request(url, 'get', 'json', params, function(ret,err){
		closedefaultload();
		func(ret,err);
	});
}

/**
 * 调用其他页面的方法
 */
function esc_function(name,frameName,jsfun){
	api.execScript({
        name: name,
        frameName: frameName,
        script: jsfun
    });
}

/**
 * 打开新页面通用
 */
function commonOpenWin(name,data){
   api.openWin({
       name: name,
       url: './'+name+'.html',
       slidBackEnabled:'false',
       vScrollBarEnabled:'false',
       hScrollBarEnabled:'false',
       reload:true,
       useWKWebView:false,
       pageParam: {
           data:data
       }
   });
}

/**
 * 打开视频播放
 */
function openPlayer(params){
	api.openFrame({
        name: 'common_video_frm',
        url: '../common/common_video_frm.html',
        slidBackEnabled:'false',
        vScrollBarEnabled:'false',
        hScrollBarEnabled:'false',
        reload:true,
        pageParam:params
    });
}

/**
 * 系统自带加载
 */
function defaultload(msg){
   api.showProgress({
       title: '',
       text: msg != undefined?msg:'努力加载中...',
       modal: true
   });
}

/**
 * 关闭系统自带加载
 */
function closedefaultload(){
	api.hideProgress();
}

/**
 * 打开frame通用
 */
function openFrameCommon(frmName,data,y,h,isBounces){
	api.openFrame({
        name: frmName,
        url: './' + frmName + '.html',
        bgColor:'#efeff4',
        animation:{
        	type:"none",                //动画类型（详见动画类型常量）
		    subType:"from_right",       //动画子类型（详见动画子类型常量）
		    duration:300
        },
        rect: {
            x: 0,
            y: y,
            w: 'auto',
            h: h
        },
        bounces: isBounces,
        pageParam:data,
        softInputBarEnabled:true,
        softInputMode:'resize'
    });
}

/**
 * frame左移动滑出
 */
function frameLeftOut(frmName){
	api.animation({
		name:frmName,
	    delay: 0,
	    duration: 300,
	    curve: 'linear',
	    repeatCount: 0,
	    autoreverse: false,
	    translation: {
	        x: -api.frameWidth,
	        y: 0,
	        z: 0
	    }
	}, function(ret, err) {
	    api.closeFrame({
	    	name:frmName
        });
	});
}
/**
 * frame右移动滑出
 */
function frameRightOut(frmName){
	api.animation({
		name:frmName,
	    delay: 0,
	    duration: 300,
	    curve: 'linear',
	    repeatCount: 0,
	    autoreverse: false,
	    translation: {
	        x: api.frameWidth,
	        y: 0,
	        z: 0
	    }
	}, function(ret, err) {
	    api.closeFrame({
	    	name:frmName
        });
	});
}

/**
 * 打开frame（从右往左进入）
 */
function openFrameFromRight(frmName,data,y,h){
	api.openFrame({
        name: frmName,
        url: './' + frmName + '.html',
        bgColor:'#efeff4',
        animation:{
        	type:"push",                //动画类型（详见动画类型常量）
		    subType:"from_right",       //动画子类型（详见动画子类型常量）
		    duration:300
        },
        rect: {
            x: 0,
            y: y,
            w: 'auto',
            h: h
        },
        bounces: false,
        pageParam:data,
        softInputBarEnabled:true,
        softInputMode:'resize'
    });
}

/**
 * 弹窗类frame
 */
function openFrameAlert(frmName,data,y,h){
	api.openFrame({
        name: frmName,
        url: './' + frmName + '.html',
        bgColor: 'rgba(0,0,0,0.6)',
        rect: {
            x: 0,
            y: y,
            w: 'auto',
            h: h
        },
        bounces: false,
        pageParam:data,
        softInputBarEnabled:true,
        softInputMode:'resize'
    });
}

/**
 * 打开考试报名页面
 */
function openExamRegistraction(type){
	if(islogin()){
		api.openDrawerLayout({
		    name: 'common_exam_sign_up_win',
		    url: '../common/common_exam_sign_up_win.html',
		    slidBackEnabled:'true',
		    vScrollBarEnabled:'false',
	  		hScrollBarEnabled:'false',
	  		reload:true,
		    pageParam: {
		    	type:type
		    },
		    animation: {
		        type: 'push',
		        subType:"from_right",
				duration:300
		    },
		    rightPane: {
		        name: 'leftPane',
		        url: '../common/common_exam_room_list_win.html',
		        vScrollBarEnabled:false,
		        hScrollBarEnabled:false,
		        bounces:false,
		        pageParam:{
		        	data:type
		        }
		    }
		});
	}else{
		openLoginHtml();
	}
}

//打开分享页面
//shareData必填项：
//①方法调用所在的winName
function openShare(shareData){
	api.openFrame({
        name: 'common_share_shadow',
        url: '../common/common_share_shadow.html',
        bgColor: 'rgba(0,0,0,0.3)',
        rect: {
            x: 0,
            y: 0,
            w: 'auto',
            h: api.winHeight
        },
        bounces: false,
        softInputBarEnabled:true,
        softInputMode:'resize',
        pageParam:shareData
    });
}

/**
 * 打开签约页面共通
 */
function openSignContract(params){
	api.openWin({
       name: 'common_sign_online_win',
       url: '../common/common_sign_online_win.html',
       slidBackEnabled:'false',
       vScrollBarEnabled:'false',
       hScrollBarEnabled:'false',
       reload:true,
       pageParam: params
   });
}

/**
 * 下拉刷新共通方法
 */
function goRefrash(loadAnimInterval,bgColor,startPics,stopPics,func){
	if(startPics == null){
		startPics = [];
		for(var i=1;i<=25;i++){
			startPics.push('widget://res/start/start'+i+'.png');
		}
	}
	if(stopPics == null){
		stopPics = [];
		for(var i=1;i<=26;i++){
			stopPics.push('widget://res/stop/load'+i+'.png');
		}
	}
	api.setCustomRefreshHeaderInfo({
	    bgColor: bgColor,
	    isScale: true,
	    loadAnimInterval : loadAnimInterval,
	    image: {
	        pull: startPics,
	        load: stopPics
	    }
	}, function() {
	    func();
	});
}

/**
 * 上拉加载通用方法
 */
function goLoad(func){
	api.addEventListener({
		name:'scrolltobottom',
		extra:{
	        threshold:20//设置距离底部多少距离时触发，默认值为0，数字类型
	    }
	}, function(ret, err){
		func(ret,err);
	});
}

//打开评论页面
//commentData必填项：
function openComment(commentData){
	api.openFrame({
        name: 'common_comment_shadow',
        url: '../common/common_comment_shadow.html',
        bgColor: 'rgba(0,0,0,0.3)',
        rect: {
            x: 0,
            y: 0,
            w: 'auto',
            h: api.winHeight
        },
        bounces: false,
        softInputBarEnabled:true,
        softInputMode:'resize',
        pageParam:commentData
    });
}

/**
 * 打开load共通
 */
function open_load(msg){
	api.openFrame({
        name: 'common_progress_frm',
        url: '../common/common_progress_frm.html',
        bgColor:'rgba(255,255,255,0.8)',
        rect: {
            x: 0,
            y: 0,
            w: api.winWidth,
            h: api.winHeight
        },
        bounces: false,
        pageParam:{
        	msg:msg
        },
        softInputBarEnabled:true,
        softInputMode:'resize'
    });
}

/**
 * 子页面打开load
 */
function open_load_lower(msg){
	api.openFrame({
        name: 'common_progress_frm',
        url: '../../common/common_progress_frm.html',
        bgColor:'rgba(255,255,255,0.8)',
        rect: {
            x: 0,
            y: 0,
            w: api.winWidth,
            h: api.winHeight
        },
        bounces: false,
        pageParam:{
        	msg:msg
        },
        softInputBarEnabled:true,
        softInputMode:'resize'
    });
}

/**
 * 父页面打开load
 */
function open_load_up(msg){
	api.openFrame({
        name: 'common_progress_frm',
        url: './common/common_progress_frm.html',
        bgColor:'rgba(255,255,255,0.8)',
        rect: {
            x: 0,
            y: 0,
            w: api.winWidth,
            h: api.winHeight
        },
        bounces: false,
        pageParam:{
        	msg:msg
        },
        softInputBarEnabled:true,
        softInputMode:'resize'
    });
}

/**
 * 关闭load共通
 */
function close_load(){
	api.closeFrame({
		name:'common_progress_frm'
    });
}

//打开通用弹出框
//title标题 content内容 sureButton确认按钮文字 sureFunc确定方法 cancelFunc取消方法 cancelButton取消按钮文字 params额外参数，没有必须传null
function openMessage(title,content,sureButton,cancelButton,sureFunc,cancelFunc,params){
	api.openFrame({
        name: 'common_alert',
        url: '../common/common_alert.html',
        bgColor: 'rgba(0,0,0,0.4)',
        rect: {
            x: 0,
            y: 0,
            w: 'auto',
            h: api.winHeight
        },
        bounces: false,
        pageParam:{
        	title:title,
        	content:content,
        	sureButton:sureButton,
        	sureFunc:sureFunc,
        	cancelButton:cancelButton,
        	cancelFunc:cancelFunc,
        	winName:api.winName,
        	frameName:api.frameName,
        	params:params
        },
        softInputBarEnabled:true,
        softInputMode:'resize'
    });
}

/**
 * 通用说明文字框
 */
function openCommonMsg(msg){
	api.openFrame({
        name: 'common_msg',
        url: '../common/common_msg.html',
        bgColor: 'rgba(0,0,0,0.6)',
        rect: {
            x: 0,
            y: 0,
            w: 'auto',
            h: api.winHeight
        },
        bounces: false,
        pageParam:{
        	msg:msg
        },
        softInputBarEnabled:true,
        softInputMode:'resize'
    });
}

//打开举报
//forumId必填
function openReport(forumId){
  	api.openFrame({
        name: 'common_report_shadow',
        url: '../common/common_report_shadow.html',
        bgColor: 'rgba(0,0,0,0.3)',
        rect: {
            x: 0,
            y: 0,
            w: 'auto',
            h: api.winHeight
        },
        bounces: false,
        softInputBarEnabled:true,
        softInputMode:'resize',
        pageParam:forumId
    });
}

/**
 * 删除体检录制视频以及做题信息
 */
function deleteExamVideo(orderId,func){
	var cache_by_account = $api.getStorage('cache_by_account');
	cache_by_account['exam_result'+orderId] = null;
	$api.setStorage("cache_by_account",cache_by_account);
	fs.exist({
	    path: 'fs://videoRecorder/examVideo'+orderId+'.mp4'
	}, function(ret, err) {
	    if (ret.exist) {
	        console.log("存在体检视频文件，进行删除");
			fs.rmdir({
			    path: 'fs://videoRecorder/examVideo'+orderId+'.mp4'
			}, function(ret, err) {
			    if (ret.status) {
			        console.log("删除体检录制视频成功");
			    } else {
			        alert_msg("删除体检录制视频失败"+JSON.stringify(err));
			    }
		        func();
			});
	    }else{
	    	func();
	    }
	});
}

/**
 * 上传体检视频以及做题信息共通方法
 */
function uploadVideoExam(orderId,winName,jsfun){
	var examResult = $api.getStorage('cache_by_account')['exam_result'+orderId];
	if(examResult == null){
		alert_msg('当前无视频，请到订单详情录制体检视频');
	}else{
		open_load();//打开上传进度加载
		setTimeout(function(){
			console.log('获取得到的上传体检信息'+JSON.stringify(examResult));
			params = {
				bucketName:AliOssBucket,
				fileNum:1,
				fileType:'learnerApp/examination/video'
			}
			console.log('进入读取视频操作');
			//获取文件上传权限
			var filePath = api.fsDir + '/videoRecorder/examVideo'+orderId+'.mp4';
			console.log('filePath'+filePath);
			fs.exist({
		        path:filePath
		    },function(ret,err){
		    	if(ret.exist){
		    		var isloadFlag = 0;//标记位 isload代表是否上传，0代表未上传，1代表捕捉上传，2代表与阿里云建立连接，3代表上传完成
						getUploadFilePower(params,function(ret,err){
							if(ret&&ret.code == 0){
								//console.log('获取文件上传权限：'+JSON.stringify(ret));
								var path = ret.fileList[0].fileId;
								isloadFlag = 1;//标记上传
								//阿里云上传可能会崩，所以这里定时器：10秒后查询标记位，把isload为2的图片让用户选择上传
								var judegeCollapse = setTimeout(function(){
									collapsevideo(isloadFlag,examResult,orderId,winName,jsfun);
								},10000);
								file_upload(ret.fileList[0].signUrl, 'put', 'json', filePath, {}, function(ret,err){
									if(ret){
										clearTimeout(judegeCollapse);//清除定时器
										isloadFlag = 2;//标记与阿里云服务器连接
										var num = ret.progress;
                    					num = num.toFixed(2);
										esc_function(winName,'common_progress_frm','changeTxt("正在上传视频，请勿关闭  '+num+'%")');
										if(ret.progress == 100&&ret.status == 1){
											alert_msg('上传完成');
											examResult.path = path;
											uploadExamResult(orderId,examResult,jsfun);//上传体检结果信息
										}
									}else if(err){
										//ios一直会返回数据类型错误(目前找不到原因)，但是图片已上传完毕，所以也当success返回
										if(systemType = 'ios'&&err.progress == 100&&err.code == 3){
											clearTimeout(judegeCollapse);//清除定时器
											isloadFlag = 2;//标记与阿里云服务器连接

											alert_msg('上传完成');
											examResult.path = path;
											uploadExamResult(orderId,examResult,jsfun);//上传体检结果信息
										}else if((systemType == 'ios'&&err.statusCode == 0)
												||(systemType == 'ios'&&err.statusCode == 403)){
											clearTimeout(judegeCollapse);//清除定时器
											//网络无法连接或者签名错误就重新上传
											uploadVideoExam(orderId,winName,jsfun);
										}
									}
									/*}else{
										var cache_by_account = $api.getStorage('cache_by_account');
										cache_by_account.exam_result = examResult;
										$api.setStorage('cache_by_account',cache_by_account);//将最近一次体检结果保存在缓存中，视频上传失败或者不传可以选择继续上传
										api.alert('上传失败，您可以在【我的】中选择继续上传');
									}*/
								});
							}else{
								alert_msg('获取文件上传权限失败');
							}
						});
		    	}else{
		    		close_load();
		    		alert_msg('本地无视频上传');
		    	}
		    });
		},600);
	}
}

/**
 * 本地缓存是否含有录制视频
 * 正常情况下 上传完成的视频是没有缓存的
 * @param {Object} orderId 订单ID
 */
function isLocalHasVideo(orderId,videoBlock) {
    var cache_by_account = $api.getStorage('cache_by_account');
    var examResult = '';
    var isTrue = false;
    var length = videoBlock == 0?4:1;
    for(var i =0;i<length;i++){
	    var nextNum = videoBlock == 0?(i+1):videoBlock;
	    var orderIds = 'exam_result' + orderId + '-' + nextNum;
	    examResult = cache_by_account[orderIds];
	    if (examResult == null || examResult == undefined || examResult == 'undefined'){
	      return false;
	    }else{
	      isTrue = true;
	    }
    }
    return isTrue;
}

/**
 * 上传体检信息到服务器
 */
function uploadExamResult(orderId,examResult,jsfun){
	esc_function('','common_progress_frm','changeTxt("视频传输完成，正在提交信息到服务器")');
	url = 'api/item-bank/insert-user-answer';
	ajax_Request(url, 'post', 'json', examResult, function(ret,err){
		if(ret){
			if(ret.code == 0){
				sendUploadSuccessMsg();
				deleteExamVideo(examResult.exaId,function(){
					close_load();
					alert_msg('上传成功');
					jsfun();
				});
			}else{
				alert_msg(ret.msg);
			}
		}else{
			alert_msg('服务器繁忙，请稍后重试333');
		}
	});
}

/**
 * 上传视频成功通知
 */
function sendUploadSuccessMsg() {
	try{
		if ("WebSocket" in window){
		     console.log("您的浏览器支持 WebSocket!");
		     /* alert("您的浏览器支持 WebSocket!"); */
		     
		     // 打开一个 web socket
		     var socket_url = '';
		     if(common_url.indexOf('dla.mohan-tech.com') != -1){
		     	//正式地址
		     	socket_url = 'wss://system.mohan-tech.com/cmBack/api/websocket';
		     }else{
		     	//测试地址
		     	socket_url = 'ws://47.111.145.197:8280/cmBack/api/websocket';
		     }
		     var ws = new WebSocket(socket_url);
		    
		     ws.onopen = function(){
		      	// Web Socket 已连接上，使用 send() 方法发送数据
		     var parms = {
        					"type":1,
        					"status":1
      		 			}
      		 			console.log("fasong1")
		      	// Web Socket 已连接上，使用 send() 方法发送数据
		     parm = JSON.stringify(parms)
		     ws.send(parm);
		      	/* alert("数据发送中..."); */
		     };
		     ws.onmessage = function (evt) { 
		      	var received_msg = evt.data;
		      	/* alert("数据已接收..."); */
		     };
		    
		     ws.onclose = function(){ 
		      	// 关闭 websocket
		      	console.log("连接已关闭..."); 
		     };
		  }else{
		     // 浏览器不支持 WebSocket
		     console.log("您的浏览器不支持 WebSocket!");
		  }
	}catch(e){
	}
}


/**
 * 判断是否有图片上传时候与阿里云断开连接
 */
function collapsevideo(isloadFlag,examResult,orderId,winName,jsfun){
	close_load();
	if(isloadFlag == 1){
		api.confirm({
		    title: '温馨提示',
		    msg: '上传体检视频与服务器断开连接，是否重连',
		    buttons: ['重新连接', '不上传了']
		}, function(ret, err) {
		    var index = ret.buttonIndex;
		    if(index == 1){
		    	uploadVideoExam(orderId,winName,jsfun);
		    }
		    if(index == 2){
				setTimeout(function() {
		        var params = {
		          	orderId: cache.orderId,
		            type: 'examination-order'
		        }
		        api.openWin({
		            name: 'record_order_detail_win',
		            url: '../mine/record_order_detail_win.html',
		            // url: 'widget://html/mine/record_order_detail_win.html.html',
		            slidBackEnabled: 'false',
		            vScrollBarEnabled: 'false',
		            hScrollBarEnabled: 'false',
		            reload: true,
		            pageParam: {
		              data: params
		            },
		            animation: {
		              type: "none"
		            }
		          });
		       }, 300)
		    }
		});
	}
}

/**
 * 去登录
 */
function openLoginHtml(data){
	api.openWin({
       name: 'unpassword_login',
       url: '../unpassword_login.html',
       slidBackEnabled:'true',
       vScrollBarEnabled:'false',
       hScrollBarEnabled:'false',
       reload:true,
       pageParam: data
   });
}

/**
 * 去认证
 */
function openAuthHtml(data){
	api.openWin({
       name: 'mine_account_auth_win',
       url: '../mine/mine_account_auth_win.html',
       slidBackEnabled:'true',
       vScrollBarEnabled:'false',
       hScrollBarEnabled:'false',
       reload:true,
       pageParam: data
   });
}

/**
 * 返回当前定位
 */
var location_result = {};
function mylocation(jsfun){
	var system_type = api.systemType;
	bMap.getLocationServices(function(ret,err){
		if(system_type == 'ios'){
			var condition = ret.enable&&(ret.authorizationStatus == 'always'||ret.authorizationStatus == 'whenInUse');
		}else{
			var condition = ret.enable;
		}
		getLocationCommon(condition,jsfun);
	});
}

function getLocationCommon(condition,jsfun){
	if (condition) {
		bMap.getLocation({
		    accuracy: '100m',
		    autoStop: true,
		    filter: 1
		}, function(ret, err) {
		    if (ret.status) {
		    	location_result.status = true;
		    	location_result.lon = ret.lon;
		    	location_result.lat = ret.lat;
		    	jsfun(location_result);
		    } else {
		    	location_result.status = false;
		    	location_result.msg = '定位失败';
		        jsfun(location_result);
		    }
		});
    } else {
    	location_result.status = false;
    	location_result.msg = '无定位权限';
        jsfun(location_result);
    }
}

/**
 * 获取账户id 前提是已登录状态，否则肯定报错
 */
function getUserId(){
	return $api.getStorage('cache_by_account').cache_account.id;
}

/**
 * 获取账号名称
 */
function getAccount(account_info){
	if(account_info.nickname != null
		&&account_info.nickname != ''
		&&account_info.nickname != undefined
		&&account_info.nickname != 'undefined'){
		return account_info.nickname;
	}else if(account_info.name != null
		&&account_info.name != ''
		&&account_info.name != undefined
		&&account_info.name != 'undefined'){
		return account_info.name;
	}else{
		return account_info.account
	}
}

//获取账号头像
function getHeadImg(account_info,jsfun){
	if(account_info.headimgurl != null
		&&account_info.headimgurl != ''
		&&account_info.headimgurl != undefined
		&&account_info.headimgurl != 'undefined'){
		returnSmallerPic(file_load_url + account_info.headimgurl,function(smallerPath){
			jsfun(smallerPath);
		});
	}else{
		jsfun('../../icon/mine/icon_mine_head.png');
	}
}


//查看图片详情
function openPic(path,flag){
	console.log('path:'+path);
	param = {
		path:path,
		flag:flag
	}
	api.openFrame({
        name: 'common_pic_detail_frm',
        url: '../common/common_pic_detail_frm.html',
        bgColor: 'rgba(0,0,0,0.6)',
        rect: {
            x: 0,
            y: 0,
            w: 'auto',
            h: api.winHeight
        },
        bounces: false,
        scaleEnabled:true,
        pageParam:param,
        softInputBarEnabled:true,
        softInputMode:'resize'
    });
}

//确认提示封装
//title标题  msg提示内容  option1执行选项 option2非执行选项 jsfun回调方法
function isSure(title,msg,option1,option2,jsfun,jsCancelfun){
	api.confirm({
	    title: title,
	    msg: msg,
	    buttons: [option1, option2]
	}, function(ret, err) {
	    var index = ret.buttonIndex;
	    if(index == 1){
	    	jsfun();
	    }
	    if(index == 2&&jsCancelfun != undefined){
	    	jsCancelfun();
	    }
	});
}

/**
 * 发送自定义事件
 */
function sendEvent(name,params){
	api.sendEvent({
	    name: name,
	    extra: params
	});
}

/**
 * 监听自定义事件
 */
function toEventListener(name,func){
	api.addEventListener({
	    name: name
	}, function(ret, err) {
	    func(ret,err);
	});
}

/**
 * 提示
 */
function alert_msg(msg){
	api.toast({
	    msg: msg,
	    duration: 1500,
	    location: 'middle'
	});
}

/**
 * 计算距离单位
 */
function calcuDistance(distance){
	if(distance == -1){
		return ' ~ m';
	}
	if(distance < 1000){
		return distance + 'm';
	}else{
		return (distance/1000).toFixed(2) + 'km';
	}
}

/**
 * 根据身份证计算年龄 addDate是需要加的天数
 */
function getAgeByIdCard(identityCard,addDate) {
    var len = (identityCard + "").length;
    if (len == 0) {
        return 0;
    } else {
        if ((len != 15) && (len != 18))//身份证号码只能为15位或18位其它不合法
        {
            return 0;
        }
    }
    var strBirthday = "";
    if (len == 18)//处理18位的身份证号码从号码中得到生日和性别代码
    {
        strBirthday = identityCard.substr(6, 4) + "/" + identityCard.substr(10, 2) + "/" + identityCard.substr(12, 2);
    }
    if (len == 15) {
        strBirthday = "19" + identityCard.substr(6, 2) + "/" + identityCard.substr(8, 2) + "/" + identityCard.substr(10, 2);
    }
    //时间字符串里，必须是“/”
    var dateBirthday = new Date(strBirthday);
    console.log('增加前'+dateBirthday);
    var birthDate = new Date(dateBirthday.setDate(dateBirthday.getDate() - addDate));
    console.log('增加后'+birthDate);
    var nowDateTime = new Date();
    var age = nowDateTime.getFullYear() - birthDate.getFullYear();
    //再考虑月、天的因素;.getMonth()获取的是从0开始的，这里进行比较，不需要加1
    if (nowDateTime.getMonth() < birthDate.getMonth() || (nowDateTime.getMonth() == birthDate.getMonth() && nowDateTime.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/**
 * 压缩图片
 */
function picImageFilter(img_path,func){
	var path_img = img_path.split("/");
	var img_name = path_img[path_img.length - 1];
	imageFilter.compress({
	    img: img_path,
	    quality: 0.5,
	    save:{
	    	album: false,           //(可选项)布尔值，是否保存到系统相册，默认false
		    imgPath:'fs://smallerPictrue',   //(可选项)保存的文件路径,字符串类型，无默认值,不传或传空则不保存，若路径不存在文件夹则创建此目录
		    imgName:img_name         //(可选项)保存的图片名字，支持png和jpg格式，若不指定格式，则默认png，字符串类型，无默认值,不传或传空则不保存
	    }
	},function(ret, err){
	    if(ret.status){
	    	func(api.fsDir + '/smallerPictrue/' + img_name);
	    }else{
	        func('');
	    }
	});
}

/**
 * 支付宝支付
 */
function AlipPay(aliPayReturn,jsfun,errfun){
	aliPayPlus.payOrder({
		orderInfo:aliPayReturn.orderInfo
	}, function(ret, err) {
	    log('阿里支付返回',ret);
	    if(ret){
	    	if(ret.code == '9000'){
	    		jsfun();
	    	}else{
		    	if(ret.code == '8000'){
		    		errfun('正在处理中，支付结果未知');
		    	}else if(ret.code == '4000'){
		    		errfun('订单支付失败');
		    	}else if(ret.code == '5000'){
		    		errfun('重复请求');
		    	}else if(ret.code == '6001'){
		    		errfun('用户中途取消支付操作');
		    	}else if(ret.code == '6002'){
		    		errfun('网络连接出错');
		    	}else if(ret.code == '6004'){
		    		errfun('支付结果未知');
		    	}else{
		    		errfun('未知状态');
		    	}
	    	}
	    }else{
	    	errfun();
	    	alert_msg('支付失败');
	    }
	});
}

/**
 * 微信支付
 */
function WechatPay(wechatpayReturn,jsfun,errfun){
	wxPayPlus.payOrder({
	    apiKey: wechatpayReturn.appKey,
	    orderId: wechatpayReturn.orderId,
	    mchId: wechatpayReturn.mchId,
	    nonceStr: wechatpayReturn.nonceStr,
	    timeStamp: wechatpayReturn.timeStamp,
	    package: wechatpayReturn.packageStr,
	    sign: wechatpayReturn.sign
	}, function(ret, err) {
		//log('微信支付返回',ret);
	    if (ret.status) {
	        jsfun();
	    }else{
		    if(err.code == 1){
		        errfun('支付错误'+err.code);
		    }else if(err.code == -2){
		    	errfun('用户取消');
		    }else{
		    	errfun('未知错误');
		    }
	    }
	});
}

//数组去重
function removeDuplicatedItem(arr) {
    for(var i = arr.length-1; i > 1 ; i--){
       for(var j = i-1; j >= 0; j--){
          if(arr[i] == arr[j]){
              arr.splice(j,1);
              j--;
          }
       }
    }
    return arr;
}

//根据评分计算星星
var star_light_num = 0;//亮星星
var star_dark_num = 0;//暗星星
function calcuStar(score){
	var star_menu = '';
	star_light_num = Math.round(score);
	star_dark_num = 5 - star_light_num;
	for(var i=0;i<star_light_num;i++){
		star_menu += '<li><img src="../../icon/common/icon_xing_light.png" alt="" /></li>';
	}
	for(var i=0;i<star_dark_num;i++){
		star_menu += '<li><img src="../../icon/common/icon_xing_dark.png" alt="" /></li>';
	}
	if((score + '').length == 1){
		score = score + '.0';
	}
	star_menu += '<li><span>'+(score)+'</span></li>';
	return star_menu;
}

//金额格式化
var cashs;
function cashFormat(cash){
	cashs = (cash + '').split('.');
	if(cashs.length == 1){
		return cash + '.<span class="txt-small">0</span>';
	}else{
		return cashs[0] + '.<span class="txt-small">' +cashs[1].substring(0,2) + '</span>';
	}
}

//纯金额格式化
function cashFormatO(cash){
	cashs = (cash + '').split('.');
	if(cash < 0){
		return '0.0';
	}else if(cashs.length == 1){
		return cash + '.0';
	}else{
		return cashs[0] + '.' + cashs[1].substring(0,2);
	}
}

//校验验证码
function isCodeAvailable(code){
	var myreg = /^\d{6}$/;
    if (!myreg.test(code)) {
        return false;
    } else {
        return true;
    }
}

//缓存图片.判断图片加载 （弃用  *赵炜炜 2019-3-13 14:05:19）
function iCache(selector) {
	selector.each(function(data) {! function(data) {
			var url = selector.eq(data).attr("src");
			var img = this;
			var pos = url.lastIndexOf("/");
			var filename = url.substring(pos + 1);
			var path = api.cacheDir + "/pic/" + filename;
			var obj = api.require('fs');
			obj.exist({
				path : path
			}, function(ret, err) {
				if (ret.exist) {
					if (ret.directory) {
						//api.alert({msg:'该路径指向一个文件夹'});
					} else {
						//api.alert({msg:'该路径指向一个文件'});
						//selector.eq(data).src=path;
						console.log("存在图片");
						selector.eq(data).attr('src', null);
						path = api.cacheDir + "/pic/" + filename;
						selector.eq(data).attr('src', path);
						//console.log(selector.eq(data).attr("src"));
					}
				}else{
					if(path!=''&&path!=null){
						api.download({
							url : url,
							savePath : path,
							report : false,
							cache : true,
							allowResume : true
						}, function(ret, err) {
							if (ret) {
								console.log('文件大小：' + ret.fileSize + '；下载进度：' + ret.percent + '；下载状态' + ret.state + '存储路径: ' + ret.savePath);
							} else {
								console.log(err.msg);
							};
						});
					}
				}
			});
		}(data);
	});
};

function opWithPermission(perm, jsfun, cancelfun) {
    if (!confirmPer(perm, jsfun, cancelfun)) {
        return;
    }
    jsfun();
}

/**
 * 判断是否包含某项权限
 */
function confirmPer(perm, jsfun, cancelfun) {
    var has = hasPermission(perm);
    if (!has || !has[0] || !has[0].granted) {
        api.confirm({
            title: '提醒',
            msg: '没有获得 ' + getNameBycode(perm) + " 权限，是否前往设置？",
            buttons: ['去设置', '取消']
        }, function (ret, err) {
            if (1 == ret.buttonIndex) {
                reqPermission(perm, jsfun, cancelfun);
            }
        });
        return false;
    }
    return true;
}

/**
 * 判断是否还有一个或者多个权限
 */
function hasPermission(one_per) {
    var perms = new Array();
    if (one_per) {
        perms.push(one_per);
    } else {
        var prs = document.getElementsByName("p_list");
        for (var i = 0; i < prs.length; i++) {
            if (prs[i].checked) {
                perms.push(prs[i].value);
            }
        }
    }
    var rets = api.hasPermission({
        list: perms
    });
    if (!one_per) {
        api.alert('判断结果：' + JSON.stringify(rets));
        return;
    }
    return rets;
}

/**
 * 去请求某项权限
 */
function reqPermission(one_per, jsfun, cancelfun) {
    var perms = new Array();
    if (one_per) {
        perms.push(one_per);
    } else {
        var prs = document.getElementsByName("p_list_r");
        for (var i = 0; i < prs.length; i++) {
            if (prs[i].checked) {
                perms.push(prs[i].value);
            }
        }
    }
    api.requestPermission({
        list: perms,
        code: 100001
    }, function (ret, err) {
        if (ret) {
            if (ret.list.length > 0) {
                if (ret.list[0].granted) {
                    //获取权限成功
                    jsfun();
                } else {
                	//未获取成功
                	cancelfun(getNameBycode(ret.list[0].name));
                }
            }
        }
    });
}

/**
 * 根据项目获取权限名称
 */
function getNameBycode(code) {
    switch (code) {
        case 'calendar':
            return '日历';
        case 'camera':
            return '相机';
        case 'contacts':
            return '通讯录';
        case 'location':
            return '定位';
        case 'microphone':
            return '麦克风';
        case 'phone':
            return '电话';
        case 'sms':
            return '短信';
        case 'storage':
            return '存储空间';
        default:
            return code;
            break;
    }
}

/**
* 延迟加载
*/
function echoInit() {
    echo.init({
        offset : 0,
        throttle : 10 //设置图片延迟加载的时间
    });
}

//根据网络图片地址获取本地缓存地址 前提是本地已缓存该图片 （弃用  *赵炜炜 2019-3-13 14:05:19）
function getLocalPicByUrl(netUrl){
	var filename = netUrl.substring(netUrl.lastIndexOf("/") + 1);
	var localPath = api.cacheDir + "/pic/" + filename;
	var obj = api.require('fs');
	var ret = obj.existSync({
	    path: localPath
	});
	if (ret.exist) {
		return localPath;
	}else{
		if(localPath!=''&&netUrl!=localPath){
			api.download({
				url : netUrl,
				savePath : localPath,
				report : false,
				cache : true,
				allowResume : true
			}, function(ret, err) {
				if (ret) {
					console.log('文件大小：' + ret.fileSize + '；下载进度：' + ret.percent + '；下载状态' + ret.state + '存储路径: ' + ret.savePath);
				} else {
					console.log(err.msg);
				};
			});
		}
		return netUrl;
	}
}

//根据当前系统及设备性能，返回最优的缩略图
function returnSmallerPic(netImgUrl,jsfun){
	api.imageCache({
	    url:netImgUrl,
	    thumbnail:true
    },function(ret,err){
    	if(ret){
    		return jsfun(ret.url);
    	}else{
    		return jsfun(netImgUrl);
    	}
    });
}

/**
 * 根据身份证获取出生年月日
 */
 function getBirthdayFromIdCard(idCard) {
	var birthday = "";
	if(idCard != null && idCard != ""){
	    if(idCard.length == 15){
	        birthday = "19"+idCard.substr(6,6);
	    } else if(idCard.length == 18){
	        birthday = idCard.substr(6,8);
	    }

	    birthday = birthday.replace(/(.{4})(.{2})/,"$1-$2-");
	}
	return birthday;
 }


//身份证验证
// 函数参数必须是字符串，因为二代身份证号码是十八位，而在javascript中，十八位的数值会超出计算范围，造成不精确的结果，导致最后两位和计算的值不一致，从而该函数出现错误。
// 详情查看javascript的数值范围
function checkIDCard(idcode){
    // 加权因子
    var weight_factor = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2];
    // 校验码
    var check_code = ['1', '0', 'X' , '9', '8', '7', '6', '5', '4', '3', '2'];

    var code = idcode + "";
    var last = idcode[17];//最后一个

    var seventeen = code.substring(0,17);

    // ISO 7064:1983.MOD 11-2
    // 判断最后一位校验码是否正确
    var arr = seventeen.split("");
    var len = arr.length;
    var num = 0;
    for(var i = 0; i < len; i++){
        num = num + arr[i] * weight_factor[i];
    }

    // 获取余数
    var resisue = num%11;
    var last_no = check_code[resisue];

    // 格式的正则
    // 正则思路
    /*
	    第一位不可能是0
	    第二位到第六位可以是0-9
	    第七位到第十位是年份，所以七八位为19或者20
	    十一位和十二位是月份，这两位是01-12之间的数值
	    十三位和十四位是日期，是从01-31之间的数值
	    十五，十六，十七都是数字0-9
	    十八位可能是数字0-9，也可能是X
    */
    var idcard_patter = /^[1-9][0-9]{5}([1][9][0-9]{2}|[2][0][0|1][0-9])([0][1-9]|[1][0|1|2])([0][1-9]|[1|2][0-9]|[3][0|1])[0-9]{3}([0-9]|[X])$/;

    // 判断格式是否正确
    var format = idcard_patter.test(idcode);

    // 返回验证结果，校验码和格式同时正确才算是合法的身份证号码
    return last === last_no && format ? true : false;
    //return true;
}

//定义replaceAll
String.prototype.replaceAll = function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}

//验证邮箱号
function isEmailAvailable(email){
  	var myreg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
  	if (!myreg.test(email)) {
      	return false;
  	} else {
      	return true;
  	}
}

/**
 * 车牌号校验
 */
function isVehicleNumber(vehicleNumber) {
	var result = false;
	if (vehicleNumber.length == 7){
	    var express = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$/;
	    result = express.test(vehicleNumber);
    }
    return result;
 }

//验证码60s不能操作
var c = 60;
function timedCount(mes){
	var code = document.getElementById('cn');
	if(1 < c && c <= 60) {
		c = c - 1;
		code.innerHTML = "等待" + c + "秒";
		setTimeout("timedCount('"+mes+"')", 1000);
		code.onclick = "";
	} else if(c == 1) {
		code.innerHTML = mes;
		$("#cn").attr("onclick","getMessage()");
		c = 60;
	}
}

//验证手机号
function isPhoneAvailable(phone) {
    var myreg = /^[1][3,4,5,6,7,8,9][0-9]{9}$/;
    if (!myreg.test(phone)) {
        return false;
    } else {
        return true;
    }
}

//验证密码
function isPasswordAvailable(password){
	var reg = /^[\w]{6,12}$/;
	if(!password.match(reg)){
	    return false;
	}else{
	    return true;
	}
}

//计算距离当前时间的距离
var parameter;
var now_time;
var difference;
var days;
var hours;
var minutes;
var seconds;
function calcuTime(time){
	if(time == null||time == undefined||time == ''){
		return '';
	}
	parameter = new Date(time.replace(/-/g, '/'));
	now_time = new Date();
	difference = now_time.getTime() - parameter.getTime();  //时间差的毫秒数
	//计算出相差天数
	days = Math.floor(difference/(24*3600*1000));
	if(days >= 90){
		return '3个月前';
	}else if(days >= 30){
		return '1个月前';
	}else if(days >= 7){
		return '1礼拜前';
	}else if(days >= 3){
		return '3天前';
	}else if(days >= 1){
		return '1天前';
	}else{
		hours = Math.floor(difference/(3600*1000));
		if(hours >= 1){
			return hours + '小时前';//大于1小时小于1天的时间差直接显示
		}else{
			minutes = Math.floor(difference/(60*1000));
			if(minutes >= 1){
				return minutes + '分钟前';//大于1分钟小于1小时的时间差直接显示
			}else{
				return '刚刚';
			}
		}
	}
}

/**
 * 时间转时间戳
 */
function timeToTimestamp(date){
	return parseInt(date.getTime()/1000);
}

/**
 * 获取当前选中的题库车型 
 */
function getBankType(kemu){
	var cache_by_app = $api.getStorage('cache_by_app');
	var item_bank_cache = cache_by_app.item_bank_cache;
	
	if(item_bank_cache){
		//存在题库类型选择缓存
		if(!item_bank_cache[kemu == '036001'?'item_bank_kemu_one':'item_bank_kemu_four']){
			//科目一/科目四无题库类型缓存那么赋予默认值
			item_bank_cache[kemu == '036001'?'item_bank_kemu_one':'item_bank_kemu_four'] = '022001';
		}
	}else{
		//如果没有题库类型选择缓存，那么都默认小车
		item_bank_cache = {
			item_bank_kemu_one:'022001',
			item_bank_kemu_four:'022001'
		}
	}
	
	cache_by_app.item_bank_cache = item_bank_cache;
	$api.setStorage('cache_by_app',cache_by_app);
	return item_bank_cache[kemu == '036001'?'item_bank_kemu_one':'item_bank_kemu_four'];
}

/**
 * 数据渲染 
 */
function loadNum(e, score, limit_time,unit) {
	var i = 0;
	var totle_num = score;
	if(score >= 20){
		var add_num = parseInt(score/limit_time/20*1000);
	}else{
		var add_num = 1;
	}
	var time2 = setInterval(function() {
		i = add_num + i;
		if (i > totle_num) {
			i = totle_num;
			clearInterval(time2);
		}
		$(e).html(i + unit);
	}, 20);
}

/**
 * 时间格式化
 */
function time_format(time){
	var hourRounds = Math.floor(time/60/60);
  	var minRounds = Math.floor(time/60);
  	if(time == 0){
  		return '0秒';
  	}else if(time < 60){
	    return '小于1分';
  	}else if(hourRounds == 0){
	    return minRounds + '分';
  	}else{
	    return hourRounds + '小时' + minRounds + '分';
  	}
}

/**
 * 打日志
 */
function log(msg,data){
	console.log(msg + JSON.stringify(data));
}

/**
 * 设置全局数据，数据会存储到本地文件系统。 
 */
function setGlobalData(key,value){
	api.setPrefs({
	    key: key,
	    value: (typeof value == 'object' && value)?JSON.stringify(value):value
	});
}

/**
 * 获取全局数据 
 */
function getGlobalData(key){
	var key_value = api.getPrefs({sync: true,key: key});
	if(key_value == undefined||key_value == ''||key_value == null){
		return undefined;
	}
	try{
		return JSON.parse(key_value);
	}catch(e){
		return key_value;
	}
}

/**
 * 计算两个时间段之差
 */
var startTime;
var endTime;
function calcuTimeValue(startTime,endTime){
	startTime = new Date(startTime);
	endTime = new Date(endTime);
	difference = endTime.getTime() - startTime.getTime();  //时间差的毫秒数
	days = Math.floor(difference/(24*3600*1000));
	var leave1= difference%(24*3600*1000);    //计算天数后剩余的毫秒数
	hours = Math.floor(leave1/(3600*1000));
	var leave2 = leave1%(3600*1000);        //计算小时数后剩余的毫秒数
	minutes = Math.floor(leave2/(60*1000));
	var leave3 = leave2%(60*1000);     //计算分钟数后剩余的毫秒数
	seconds = Math.round(leave3/1000);
	return (days == 0?'':days + "天") + (hours == 0?'':hours + "小时") + (minutes == 0?'':minutes + "分") + (seconds == 0?'':seconds + "秒");
}

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
	    "M+" : this.getMonth()+1, //月份
	    "d+" : this.getDate(), //日
	    "h+" : this.getHours()%12 == 0 ? 12 : this.getHours()%12, //小时
	    "H+" : this.getHours(), //小时
	    "m+" : this.getMinutes(), //分
	    "s+" : this.getSeconds(), //秒
	    "q+" : Math.floor((this.getMonth()+3)/3), //季度
	    "S" : this.getMilliseconds() //毫秒
	    };
    var week = {
	    "0" : "日",
	    "1" : "一",
	    "2" : "二",
	    "3" : "三",
	    "4" : "四",
	    "5" : "五",
	    "6" : "六"
    };
    if(/(y+)/.test(fmt)){
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
    if(/(E+)/.test(fmt)){
        fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "星期" : "周") : "")+week[this.getDay()+""]);
    }
    for(var k in o){
        if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
    return fmt;
}

/**
 * 判断是否超时
 */
function isTimeout(time,date){
	var this_time = date.replace("-", "/").replace("-", "/").substring(0,10) + ' '+ time + ':00';
	if(new Date().getTime() >= new Date(this_time).getTime()){
		return true;
	}else{
		return false;
	}
}

/**
 * 时间控件 ，需要引入插件
 */
function mobiscrollDate(minDate,maxDate,e,nowText){
	var currYear = (new Date()).getFullYear();
	var opt={};
	opt.date = {preset : 'date'};
	opt.datetime = {preset : 'datetime'};
	opt.time = {preset : 'time'};
	opt.default = {
		theme: 'android-ics light', //皮肤样式
		display: 'modal', //显示方式
		mode: 'scroller', //日期选择模式
		dateFormat: 'yyyy-mm-dd',
		lang: 'zh',
		showNow: true,
		nowText: nowText,
		minDate: new Date(minDate),
		maxDate: new Date(maxDate),
		preset: 'date'//日期类型--datatime --time,
	}
	$(e).mobiscroll($.extend(opt['datetime'], opt['default']));
}

/**
 * 是否含有某一js文件
 * @param {Object} name
 */
function isInclude(name){
    var js= /js$/i.test(name);
    var es=document.getElementsByTagName(js?'script':'link');
    for(var i=0;i<es.length;i++)
    if(es[i][js?'src':'href'].indexOf(name)!=-1)return true;
    return false;
}

/**
 * 控制rem大小
 * @param {Object} doc
 * @param {Object} win
 */
(function(doc, win) {
	var docEl = doc.documentElement,
		resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
		recalc = function() {
			var clientWidth = docEl.clientWidth;
			if (!clientWidth) return;
			if (clientWidth >= 750) {
				clientWidth = 750;
			} else if (clientWidth <= 320) {
				clientWidth = 320;
			} else {
				clientWidth = clientWidth;
			}
			docEl.style.fontSize = 20 * (clientWidth / 375) + 'px';
		};
	if (!doc.addEventListener) return;
	win.addEventListener(resizeEvt, recalc, false);
	doc.addEventListener('DOMContentLoaded', recalc, false);
})(document, window);

//base64
var Base64 = {

    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }
        return string;
    }
}

/**
 * 图片转base64
 * @param {Object} url
 * @param {Object} callback
 */
function picToBase64(url, callback){
	var canvas = document.createElement('CANVAS'),
    ctx = canvas.getContext('2d'),
	img = new Image;
	img.crossOrigin = 'Anonymous';
	img.onload = function(){
		var scale = img.width/img.height;
		//压缩到800px等比例
		$(canvas).attr({
            width: 800,
            height: 800/scale
        });
		ctx.drawImage(img,0,0,800,800/scale);
		var dataURL = canvas.toDataURL('image/png',0.8 || 0.8);
		callback(dataURL);
		canvas = null;
	};
	img.src = url;
}



//-------------------------------------------关于本地缓存的处理方法---------------------------------


/**
 * 判断是否登录
 */
function islogin(){
	if($api.getStorage('islogin') == 'true'&&$api.getStorage('cache_by_account').cache_account != undefined){
		return true;
	}else{
		return false;
	}
}

/**
 * 判断是否已递交实名认证
 */
function isauth(){
	//log('用户信息',$api.getStorage('cache_by_account').cache_account);
	if($api.getStorage('cache_by_account').cache_account.identification != 0&&$api.getStorage('cache_by_account').cache_account.identification != undefined){//0未认证1认证中2认证通过
		return true;
	}else{
		return false;
	}
}

/**
 * 判断是否认证通过
 */
function isauthpass(){
	if($api.getStorage('cache_by_account').cache_account.identification == 2){//0未认证1认证中2认证通过
		return true;
	}else{
		return false;
	}
}

/**
 * 更新本地学员信息
 * @param {Object} func
 */
function updateLearnerInfo(func){
	defaultload('获取学员信息...');
	url = 'api/learner';
	params = {
		learner:{
			id:getUserId()
		}
	}
	ajax_Request(url, 'get', 'json', params, function(ret,err){
		closedefaultload();
		//log('获取的学员信息',ret);
		if(ret&&ret.code == 0){
			var cache_by_account = $api.getStorage('cache_by_account');
			cache_by_account.cache_account = ret.learner;
			$api.setStorage('cache_by_account',cache_by_account);//更新app中的实名缓存信息
		}else{
			alert_msg('获取学员信息失败');
		}
		func(ret,err);
	});
}

/**
 * 根据code获取字典表信息list,code为父节点
 * @param {Object} code
 * @param {Object} func
 */
function getDictionaryByCode(code,func){
	var cache_dictionary = $api.getStorage('cache_by_app').cache_dictionary;
	func(cache_dictionary[code].dictionaryList);
}

/**
 * 返回标签名称
 */
var labelsMap;
function getLabelName(code){
	labelsMap = $api.getStorage('cache_by_app').labelsMap;
	return labelsMap[code] != undefined?labelsMap[code]:'无效标签';
}

/**
 * 返回题目分类
 */
var questionTypeKeMuOneMap;
var questionTypeKeMuFourMap;
function checkQuestionType(code){
	questionTypeKeMuOneMap = $api.getStorage('cache_by_app').questionTypeKeMuOneMap;
	questionTypeKeMuFourMap = $api.getStorage('cache_by_app').questionTypeKeMuFourMap;
	return questionTypeKeMuOneMap[code] != undefined?questionTypeKeMuOneMap[code]:questionTypeKeMuFourMap[code];
}

/**
 * 返回题目类型
 */
var questionTypeMap;
function checkQuestionOfType(code){
	questionTypeMap = $api.getStorage('cache_by_app').questionTypeMap;
	return questionTypeMap[code];
}

/**
 * 返回章节内容
 */
var chapterKuMuOneMap;
var chapterKuMuFourMap;
function returnChapter(code){
	chapterKuMuOneMap = $api.getStorage('cache_by_app').chapterKuMuOneMap;
	chapterKuMuFourMap = $api.getStorage('cache_by_app').chapterKuMuFourMap;
	return chapterKuMuOneMap[code] != undefined?chapterKuMuOneMap[code]:chapterKuMuFourMap[code];
}

/**
 * 阿里日志-埋点统计JS sdk初始化 
 */
(function(window, document){
    function createHttpRequest()
    {
        if(window.ActiveXObject){
            return new ActiveXObject("Microsoft.XMLHTTP");  
        }
        else if(window.XMLHttpRequest){
            return new XMLHttpRequest();  
        }  
    }
    function AliLogTracker(host,project,logstore)
    {
        this.uri_ = 'http://' + project + '.' + host + '/logstores/' + logstore + '/track?APIVersion=0.6.0';
        this.params_=new Array();
        this.httpRequest_ = createHttpRequest();
    }
    AliLogTracker.prototype = {
        push: function(key,value) {
            if(!key || !value) {
                return;
            }
            this.params_.push(key);
            this.params_.push(value);
        },
        logger: function()
        {
            var url = this.uri_;
            var k = 0;
            while(this.params_.length > 0)
            {
                if(k % 2 == 0)
                {
                    url += '&' + encodeURIComponent(this.params_.shift());
                }
                else
                {
                    url += '=' + encodeURIComponent(this.params_.shift());
                }
                ++k;
            }
            try
            {
                this.httpRequest_.open("GET",url,true);
                this.httpRequest_.send(null);
            }
            catch (ex) 
            {
                if (window && window.console && typeof window.console.log === 'function') 
                {
                    console.log("Failed to log to ali log service because of this exception:\n" + ex);
                    console.log("Failed log data:", url);
                }
            }
            
        }
    };
    window.Tracker = AliLogTracker;
})(window, document);

/**
 * 发送app端的错误日志
 * @from 错误日志点发生点
 * @error_log 错误日志，可以把整个error转为json后放进去
 * @leverl 错误日志严重等级 1最严重2严重3较严重
 */
function sendErrorLog(from,error_log,leverl){
	var errlogger = new window.Tracker('cn-hangzhou.log.aliyuncs.com','drivinghome','app_error_log');
	errlogger.push('learnerId', islogin()?getUserId():'');
	errlogger.push('from', from);
	errlogger.push('errorLog', error_log);
	errlogger.push('systemType', api.systemType);
	errlogger.push('systemVersion', api.systemVersion);
	errlogger.push('appVersion', api.appVersion);
	errlogger.push('deviceModel', api.deviceModel);
	errlogger.push('connectionType', api.connectionType);
	errlogger.push('insertDt', new Date().Format('yyyy-MM-dd HH:mm:ss'));
	errlogger.push('winName', api.winName);
	errlogger.push('frameName', api.frameName);
	errlogger.push('fromApp', 'learner');
	errlogger.push('errorLeverl', leverl);
	errlogger.logger();
}

/**
 *  系统埋点记录
 *  @params 自定义参数
 * 	@buryingPointName 埋点处名称
 * 	@fatherBuryingPointName 埋点处上级名称
 * 	@grandFatherBuryingPointName 埋点处上上级名称
 * 	@grandGrandFatherBuryingPointName 埋点处上上上级名称
 */
function logAppBuryingPoint(params,buryingPointName,fatherBuryingPointName,grandFatherBuryingPointName,grandGrandFatherBuryingPointName){
	if(common_url.indexOf('dla.mohan-tech.com') != -1){
		//只有正式地址才去收集埋点数据
		var burypointlogger = new window.Tracker('cn-hangzhou.log.aliyuncs.com','drivinghome','burying_point_log');
		for(var prop in params){
			burypointlogger.push(prop, params[prop]);
		}
		burypointlogger.push('userId', islogin()?getUserId():'');
		burypointlogger.push('buryingPointName', buryingPointName);
		burypointlogger.push('fatherBuryingPointName', fatherBuryingPointName?fatherBuryingPointName:'');
		burypointlogger.push('grandFatherBuryingPointName', grandFatherBuryingPointName?grandFatherBuryingPointName:'');
		burypointlogger.push('grandGrandFatherBuryingPointName', grandGrandFatherBuryingPointName?grandGrandFatherBuryingPointName:'');
		burypointlogger.push('pointFrom', 'learner');
		burypointlogger.push('insertDt', new Date().Format('yyyy-MM-dd HH:mm:ss'));
		burypointlogger.logger();
	}
}

/**
 * 百度移动不带参数统计方法
 */
function onEvent(id,name) {
    var demo = api.require('modulebaidumtj');
    demo.onEvent({
        eventId: id,
        eventLabel:name 
    });
}

/**
 * 百度移动统计初始化
 */
function startWithAppkey(){
	if (api.systemType != "ios") {
        // android平台的初始化
        var demo = api.require('modulebaidumtj');
        demo.startWithAppkey({
            appkey: '281ce07e21',
            appVersion: api.appVersion,
            channelId: api.channel,
            enableExceptionLog: 'true',
            enableDebugOn: 'true'
        });
    } else {
        // iOS平台的初始化
        var demo = api.require('modulebaidumtj');
        demo.startWithAppkey({
                appkey: '9d9ea74242',
                appVersion: api.appVersion,
                channelId: api.channel,
                enableExceptionLog: 'true',
                enableDebugOn: 'true'
        });
    }
}

/**
 * 百度移动带参数统计方法
 */
function onEventWithAttributes(id,name,param) {
    var demo = api.require('modulebaidumtj');
    demo.onEventWithAttributes({
        eventId: id,
        eventLabel: name,
        attributes:param
    });
}


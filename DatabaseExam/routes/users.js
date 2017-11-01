var express = require('express');
var router = express.Router();
//mysql연동
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'test1234',
  database : 'iot'
});
connection.connect();
//---------------------------------------------
var MongoClient = require('mongodb').MongoClient;
// Connection URL
var url = 'mongodb://localhost:27017/iot';
var dbObj = null;
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
  console.log("Connected correctly to server");
  dbObj = db;
});

router.get('/', function(req, res, next) {
 // res.send('respond with a resource');//res.send는 마지막에
  connection.query('select id,email,name,age from user',
  	function(err,results,fields){
  		if(err){
  			res.send(JSON.stringify(err));
  		}
  		else{
  			res.send(JSON.stringify(results));
  		}
  	});
});
//특정 사용자 정보 조회 : GET - /users/id
router.get('/:id',function(req, res, next){
	connection.query('select * from user where id=?',
		[req.params.id],
		function(err,results,fields){
			if(err){
				res.send(JSON.stringify(err));
			}else{
				if(results.length>0){
					connection.query(
						'select * from device where user_id=?',
						[req.params.id],function(err2,results2,fields2){
							if(err2)res.send(JSON.stringify(err2));
							else{
								var logs = dbObj.collection('logs');
								logs.find({user_id:Number(req.params.id)}).
									toArray(function(err3,results3){
										if(err3)res.send(JSON.stringify(err));
										else {
											results[0].device = results2;
											results[0].logs = results3;
											res.send(JSON.stringify(results[0]));
										}
									});
							}
						});
					//res.send(JSON.stringify(results[0]));
				}else{
					res.send(JSON.stringify({}));
				}
			}
		});
	//res.send(JSON.stringify({id:req.params.id}));
});
//사용자 정보 추가 : POST - /users
var crypto = require('crypto');
router.post('/',function(req,res,next){
	var email = req.body.email;
	var password =req.body.password;
	var name = req.body.name;
	var age = req.body.age;
	console.log(email+' '+password+' '+name+' '+age);
	var hash = crypto.createHash("sha512").update(password)
	.digest('base64');
	console.log(hash);
	connection.query('insert into user(email,password,name,age) value(?,?,?,?)',
		[ email, hash, name, age],
		function(err,result){
			if(err){
				res.send(JSON.stringify(err));
			}else{
				res.send(JSON.stringify(result));
			}
		});
	//res.send(JSON.stringify({email:email,password:hash,
	//	name:name,age:age}));
	
});
//사용자 정보 수정 : PUT - /users/id
router.put('/:id',function(req,res,next){
	var email = req.body.email;
	var password =req.body.password;
	var name = req.body.name;
	var age = req.body.age;
	console.log(email+' '+password+' '+name+' '+age);
	console.log(hash);
	var query = 'update user set ';
	var conditions = [];
	if(email != undefined){
		query += "email=?,";conditions.push(email);
	}
	if(password != undefined){
		var hash = crypto.createHash("sha512").update(password)
	.digest('base64');
		query += "password=?,";conditions.push(hash);
	}
	if(name != undefined){
		query += "name=?,";conditions.push(name);
	}
	if(age != undefined){
		query += "age=?";conditions.push(age);
	}
	query +=" where id=?";
	if(query[query.length-1] == ',')
		query = query.substring(0,query.length-1);
	conditions.push(req.params.id);
	connection.query(query,conditions,
	//connection.query('update user set email=?,password=?,name=?,age=?',
	//	[email,hash,name,age,req.params.id],
		function(err, result){
			if(err){
				res.send(JSON.stringify(err));
			}else{
				res.send(JSON.stringify(result));
			}
		});
	//res.send(JSON.stringify({}));
});
//사용자 정보 삭제 : DELETE - /users/id
router.delete('/:id',function(req,res,next){
	connection.query('delete from user where id=?',[req.params.id],
		function(err,result){
			if(err){
				res.send(JSON.stringify(err));
			}else{
				res.send(JSON.stringify(result));
			}
	});
	//res.send(JSON.stringify({id:req.params.id}));
});

module.exports = router;

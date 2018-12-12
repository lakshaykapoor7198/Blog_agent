var express=require('express');
var app=express();
var MongoClient=require('mongodb').MongoClient;
var flash=require('connect-flash');
var bodyParser=require('body-parser');
var expressValidator=require('express-validator');
var session=require('express-session');
var multer=require('multer');
var ejs=require('ejs');
var path=require('path');

app.set('port',process.env.PORT||3000);
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));


app.use(multer({dest:'./public/images/uploads'}).any());

app.use(session({
	secret:'secret',
	saveUninitialized:true,
	resave:true
}));

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(function(req,res,next){
	res.locals.errors=null;
	res.locals.errors1=null;
	next();
});

require("appdynamics").profile({
	controllerHostName: 'pdx-s-con-btd.saas.appdynamics.com',
	controllerPort: 80, 
	  accountName: 'customer2',
	accountAccessKey: 'e916e279-963c-42cd-adb9-66d62c2eec26',
	applicationName: 'Blog-Test',
	tierName: 'Tier1',
	nodeName: 'process-heroku' // The controller will automatically append the node name with a unique number
   });
   
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));
app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

app.use(express.static(path.join(__dirname,'public')));

app.locals.moment=require('moment');

app.locals.truncateText= function(text,length){
	var truncatedText=text.substring(0,length);
	return truncatedText;
}

app.get('/',function(req,res){
	MongoClient.connect('mongodb://localhost/nodeblog',function(err,db){
		var col=db.collection('posts');
		col.find().limit(2000).toArray(function(error,posts){
			res.render('index',{
				title:'Blog',
				posts:posts,
			});
		});	
	});
});
app.get('/posts/add',function(req,res){
	MongoClient.connect('mongodb://localhost/nodeblog',function(err,db){
		var col=db.collection('categories');
		col.distinct('title',function(error,posts){
			res.render('post',{
				title:'Post',
				posts:posts,
			});
		});	
	});
	
});


app.post('/posts/add',function(req,res){
	var title=req.body.title;
	var category=req.body.category;
	var body=req.body.body;
	var author=req.body.author;
	var date=new Date();
	if(req.files.mainimage){
		var mainImageOriginalName=req.files.mainimage.originalname;
		var mainImageName=req.files.mainimage.name;
		var mainImageMime=req.files.mainimage.mimetype;
		var mainImageSize=req.files.mainimage.size;
		var mainImageExt=req.files.mainimage.extension;
		var mainImagePath=req.files.mainimage.path;
	}
	else{
		var mainImageName='noimage.png';
	}

	mainImageName=req.files[0].filename;

	req.checkBody('title','Title cant be empty').notEmpty();
	req.checkBody('body','Body cant be empty').notEmpty();

	var errors=req.validationErrors();

	if(errors){
		MongoClient.connect('mongodb://localhost/nodeblog',function(err,db){
		var col=db.collection('posts');
		col.distinct('category',function(error,posts){
			res.render('post',{
				title:'Post',
				posts:posts,
				body:body,
				errors:errors
			});
		});	
	});
	}
	else{
		var newPost={
			title:title,
			category:category,
			body:body,
			author:author,
			date:date,
			mainimage:mainImageName,
		}

		MongoClient.connect('mongodb://localhost/nodeblog',function(err,db){
			var col=db.collection('posts');
			col.insert(newPost,function(error,data){
				console.log('Data Inserted');
				req.flash('success','New post has been added');
				res.location('/');
				res.redirect('/');
			});
		});
	}
});

app.get('/categories/add',function(req,res){
	res.render('categories',{
			title:'Categories',
	});
});

app.post('/categories/add',function(req,res){
	var title=req.body.title;
	req.checkBody('title','Title cant be empty').notEmpty();

	var errors1=req.validationErrors();

	if(errors1){
		res.render('categories',{
			title:'Categories',
			errors1:errors1
		});
	}
	else{

		MongoClient.connect('mongodb://localhost/nodeblog',function(err,db){
			var col=db.collection('categories');
			col.insert({title:title},function(error,data){
				console.log('Data Inserted');
				req.flash('success','New Category has been added');
				res.location('/');
				res.redirect('/');
			});
		});
	}
});


app.listen(app.get('port'),function(){
	console.log('Server is up at http://localhost:'+app.get('port'));
});
var express = require('express');
var router = express.Router();
const userModel = require("./users")
const postModel = require("./posts")
const passport = require("passport");
const upload = require('./multer')
const moment = require('moment');

const localStrategy = require('passport-local');
const posts = require('./posts');
passport.use(new localStrategy(userModel.authenticate()));


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
  res.render('login', {error: req.flash('error')});
});

router.get('/feed', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  const posts = await postModel.find()
  .populate("user")

  res.render("feed", {user, posts})
});

router.post('/upload', isLoggedIn , upload.single("file") , async function(req, res, next) {
  if (!req.file){
    return res.status(404).send('no files were given');
  }
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    image: req.file.filename,
    postTitle: req.body.title,
    postDesc: req.body.desc
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile');
  
});

router.post('/fileupload', isLoggedIn , upload.single("image") , async function(req, res, next) {
 const user = await userModel.findOne({username: req.session.passport.user});
 user.dp = req.file.filename;
 await user.save();
 res.redirect('/profile');
});

router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  .populate('posts');
  res.render("profile", {user});
});

router.get('/show/posts', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  .populate('posts');
  res.render("show", {user, moment});
});


router.get('/add', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  res.render("add", {user});
});

router.post("/register", function(req , res){
  const {username, email, fullname} = req.body;
  const userData = new userModel({ username, email, fullname});

  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req, res, function(){
      res.redirect("/profile");
    })
  })
})

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true,
}) ,function(req , res){
  
})

router.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});

router.use((req, res, next) => {
  res.locals.moment = moment;
  next();
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
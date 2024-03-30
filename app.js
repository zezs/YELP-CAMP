const express = require('express')
const path = require('path')
const methodOverride = require('method-override')
const morgan = require('morgan')
const ejsMate = require('ejs-mate')
const Joi = require('joi')
const AppError = require('./AppError')
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const {isLoggedIn} = require('./middleware')

const Campground = require('./models/campground')
const Review = require('./models/review');
const User = require('./models/user');

// const campgroundRoutes = require('./routes/campgrounds');
const userRoutes = require('./routes/user');


app.set('views', path.join(__dirname, '/views'));
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.use(methodOverride('_method')); 
app.use(express.urlencoded({ extended: true }));    // to access request.body & response.body (This is middle)
const session = require('express-session')
const flash = require('connect-flash');
app.use(flash());
const sessionConfig = {
  secret: 'thisshouldbeabettersecret!',
  resave: false,
  saveUninitialized: true,
  cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7
  }
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
  // console.log(req.session)
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})


app.use(morgan('common'))


// const validateCampground = (req, res, next) => {
//   const campgroundSchema = Joi.object({
//     campground: Joi.object({
//         title: Joi.string().required(),
//         price: Joi.number().required().min(0),
//         image: Joi.string().required(),
//         location: Joi.string().required(),
//         description: Joi.string().required()
//     }).required()
//   })
//   console.log(req.body)
//   const {error} = campgroundScheama.validate(req.body, camp);
//   // console.log("***************************",error,"***************************")
//   if(error){
//     const msg = error.deatils.map(el => el.messgae).join(',')
//     console.log("222222222222222YYYYYYYYYYYYYYYYYYYYY")
//     throw new AppError(msg, 400)   

//   }
//   else{
//     console.log("222222222222222222NNNNNNNNNNNNNNNNNNN")
//     next();
//   }
// }


const mongoose = require('mongoose');
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp' );
  console.log("Connection open!!!");
}


// const campgroundRoutes = require('./models/campground') //CAmpground collection/table called in script
const user = require("./models/user")

app.get('/campgrounds', isLoggedIn, async(req, res, next)=>{
    // console.log(`REQUEST DATE: ${req.requestTime}`)
    try{
      const campgrounds = await Campground.find({});
      console.log(campgrounds);
    res.render('campgrounds/index.ejs', {campgrounds})
    }
    catch(e){
      next(e)
    }
})

app.get('/campgrounds/new', isLoggedIn, (req, res)=>{
    res.render('campgrounds/new.ejs')
    console.log("111111111111111111111111111")
})
app.post('/campgrounds', isLoggedIn, async(req, res, next)=>{

  try{
      console.log(req.body)
      // if (!req.body.campground) throw new AppError('Invalid Camp ground data', 400)
      // throw new AppError("Nabeel is cool!!", 500)
      const campground = new Campground(req.body)
      campground.author = req.user._id;
      console.log(campground);
      await campground.save();
      req.flash('success', 'Successfully made a new campground')
      res.redirect(`/campgrounds/${campground._id}`)
    }

    catch(error){
      console.log("4444444444444444444eeeeeeeeeeeeeeeeeeeeeeeee")
      next(error)
    }
})

// adding next as there is an error handler for async function
app.get('/campgrounds/:id/edit', isLoggedIn, async(req, res, next)=>{
  try{
    const {id} = req.params;
    const campground = await Campground.findById(id);
    if(!campground){
      return next(new AppError('No campground with id', 404)); //alwawsy return
    }
    res.render('campgrounds/edit.ejs', {campground})
  }
  catch(e){
    next(e);
  }
})
app.put('/campgrounds/:id', async(req, res, next)=>{
  try{
    const {id} = req.params;
    const campground = await Campground.findByIdAndUpdate(id, req.body);
    console.log(req.body)
    res.redirect(`/campgrounds/${campground._id}`)
  }
  catch(e){
    next(e);
  }
})

// error handling in asyn cusing custom class, also add next
app.get('/campgrounds/:id', isLoggedIn, async(req, res, next)=>{
  try{
    const {id} = req.params;
    console.log(id)
    const campground = await Campground.findById(id).populate({ path:'reviews',
    populate: {
      path: 'author'
    }
  }).populate('author');
    console.log(campground)
    if(!campground){
      throw new AppError('No campground with id', 404); //alwawsy return
    }
    res.render('campgrounds/show.ejs', {campground})
  } catch (e) {
    next(e);
  }
})

app.delete('/campgrounds/:id', async(req, res)=>{
  try{
    const {id} = req.params;
    const campground = await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
  }
  catch(e){
    next(e);
  }
})

//**********REVIEW******************/
// review create
app.post('/campgrounds/:id/reviews', isLoggedIn, async(req, res) => {
  try{
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    console.log(review);
    await review.save();
    await campground.save();
    // req.flash('success', 'Created new review!')
    res.redirect(`/campgrounds/${campground._id}`);
  }
  catch(e){
    next(e);
  }
})
//review delete
app.delete('/campgrounds/:id/reviews/:reviewId', async(req, res)=>{
  const { id, reviewId} = req.params;
  //first removeing references in Campgroundcollection and then removing review in review collection
  await Campground.findByIdAndUpdate(id, { $pull: {reviews: reviewId}}) // $pull(used in references):removes all reviews in Reviews with reviewId
  console.log("1111111111111111111111111")
  await Review.findByIdAndDelete(reviewId);
  console.log("2222222222222222222222222")
  res.redirect(`/campgrounds/${id}`);
})




app.use('/', userRoutes);




//another error handler FINAL hope so
app.use((err, req, res, next)=>{
  console.log("******IN FINAL*****")
  const {status=500} = err;
  if(!err.message) err.message = "Oh No, Something went Wrong!";
  console.log(err, status, err.message)
  // res.status(status).send(message)
  res.status(status).render('campgrounds/error.ejs', {err})
})

// listening 
app.listen(3000, ()=>{
  console.log("Listening at 3000!")
})

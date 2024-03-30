const express = require('express')
const path = require('path')
const methodOverride = require('method-override')
const morgan = require('morgan')
const ejsMate = require('ejs-mate')
const Joi = require('joi')
const AppError = require('./AppError')


const app = express();
app.set('views', path.join(__dirname, '/views'));
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.use(methodOverride('_method')); 
app.use(express.urlencoded({ extended: true }));    // to access request.body & response.body (This is middle)
app.use(morgan('common'))


const mongoose = require('mongoose');
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp' );
  console.log("Connection open!!!");
}


const Campground = require('./models/campground') //CAmpground collection/table called in script
const Review = require("./models/review")

// Home
app.get('/campgrounds', async(req, res, next)=>{
    // console.log(`REQUEST DATE: ${req.requestTime}`)
    try{
      const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs', {campgrounds})
    }
    catch(e){
      next(e)
    }
})

//NEW creating
app.get('/campgrounds/new', (req, res)=>{
    res.render('campgrounds/new.ejs')
    console.log("111111111111111111111111111")
})
app.post('/campgrounds', async(req, res, next)=>{

  try{
      console.log(req.body)
      const campground = new Campground(req.body)
      console.log(campground)
      console.log(campground);
      await campground.save();
      console.log("SSSSSSSSSS333333333333333333333")
      res.redirect(`/campgrounds/${campground._id}`)
    }

    catch(error){
      console.log("4444444444444444444eeeeeeeeeeeeeeeeeeeeeeeee")
      next(error)
    }
})


// EDIT
app.get('/campgrounds/:id/edit', async(req, res, next)=>{
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


// VIEW
app.get('/campgrounds/:id', async(req, res, next)=>{
  try{
    const {id} = req.params;
    console.log(id)
    const campground = await Campground.findById(id).populate('reviews');
    console.log(campground)
    if(!campground){
      throw new AppError('No campground with id', 404); //alwawsy return
    }
    res.render('campgrounds/show.ejs', {campground})
  } catch (e) {
    next(e);
  }
})


// DELETE
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


// review create
app.post('/campgrounds/:id/reviews', async(req, res) => {
  try{
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    console.log(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
  }
  catch(e){
    next(e);
  }
})

//delete review
app.delete('/campgrounds/:id/reviews/:reviewId', async(req, res)=>{
  const { id, reviewId} = req.params;
  //first removeing references in Campgroundcollection and then removing review in review collection
  await Campground.findByIdAndUpdate(id, { $pull: {reviews: reviewId}}) // $pull(used in references):removes all reviews in Reviews with reviewId
  console.log("1111111111111111111111111")
  await Review.findByIdAndDelete(reviewId);
  console.log("2222222222222222222222222")
  res.redirect(`/campgrounds/${id}`);
})


//error handler FINAL
app.use((err, req, res, next)=>{
  console.log("******IN FINAL*****")
  const {status=500} = err;
  if(!err.message) err.message = "Oh No, Something went Wrong!";
  console.log(err, status, err.message)
  // res.status(status).send(message)
  res.status(status).render('campgrounds/error.ejs', {err})
})

app.listen(3000, ()=>{
  console.log("Listening at 3000!")
})

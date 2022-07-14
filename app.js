const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();

// 'ejs' set as the 'view engine' for our express-generated app.
app.set('view engine', 'ejs');

// express app can now use the info inside url
app.use(express.urlencoded({extended:false}));

// We accumulate all our static files in the "public" folder and ask express to serve them it will automatically look inside it for static files.
app.use(express.static("public"));

//connecting to our MongoDB started on Port: 27017
mongoose.connect("mongodb://localhost:27017/todolistDB", {useUnifiedTopology: true , useNewUrlParser: true });

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

// List Default Items
const item1 = new Item({
  name: "Welcome to your To-Do list"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.use('/FAVICON.ICO',(req,res,next)=>{
  res.status(204).end()
})

app.get("/", function(req, res) {
  const day = date.getDay();
  Item.find({}, function(err, items){
    if (err) {
      console.log(err);
    } else if (items.length === 0) {
      Item.insertMany([item1, item2, item3], function(err, items){
        if (err){
          console.log(err);
        } else {
          console.log("Successfully Added the Items");
          res.redirect("/");
        }
      });
    } else {
      res.render("list", {listTitle: day, newTasks: items});
    }
  });
});

app.get("/:customListName", function(req, res){

  var customListName = (req.params.customListName).toLocaleUpperCase();
  // findOne() method does not return an array like find()
  List.findOne({name: customListName}, function(err, foundList){
    if (err) {
      console.log(err);
    } else {
      console.log("ASdasd",foundList)
      if (!foundList){
        new List ({
          name:customListName,
          items:[]
        }).save().then((createlist)=>{
          foundList=createlist;
          res.render("list", {listTitle: foundList.name, newTasks: foundList.items});
        }).catch(err=>console.log("errr",err))
      }
      else{
        res.render("list", {listTitle: foundList.name, newTasks: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.post("/", function(req, res) {
  const job = req.body.task;
  const list = req.body.list;
  const newtask = new Item({
    name: job
  });
  if (list === date.getDay()) {
    newtask.save();
    res.redirect("/");
  } else {
    List.findOne({name: list}, function(err, foundList){
      if (err) {
        console.log(err);
      } else {
        foundList.items.push(newtask);
        foundList.save();
        res.redirect("/" + list);
      }
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === date.getDay()) {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Item with _id = "+ checkedItemId + "is deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + listName);
      }
    });
  }
});

app.listen(3000, function() {
  console.log("Server is running on Port 3000");
});

const express = require('express')
const app = express()
const userModel = require('./models/user')
const postModel = require("./models/post")
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')


app.set("view engine", "ejs")
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get("/", (req, res) => {
    res.render("index")
})

app.post("/register", async (req, res) => {
    let { email, password, username, name, age } = req.body;

    //checking if the user already exists with this email before regstering or creating a new user
    let user = await userModel.findOne({ email })
    if (user) return res.status(500).send("User already registered");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userModel.create({
                username, email, age, name, password: hash
            })
            let token = jwt.sign({ email: email, userid: user._id }, "ananya22")
            res.cookie("token", token)
            res.send("Registered")


        })


    })
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", async (req, res) => {
    let { email, password } = req.body;

    //checking if the user already exists with this email before regstering or creating a new user
    let user = await userModel.findOne({ email })
    if (!user) return res.status(500).send("Something went wrong");
    bcrypt.compare(password, user.password, function (err, result) {
        //if password is correct
        if (result){
            let token = jwt.sign({ email: email, userid: user._id }, "ananya22")
            res.cookie("token", token)
            res.status(200).redirect("/profile");
           
        }
        else res.redirect("/login")
    })
})


app.get("/logout", async (req, res) => {
    res.cookie("token", "");
    res.redirect("/login")
})


app.get("/profile" , isloggedin , async(req,res)=>{   //hum profile pe tbhi jaa skte hai, jb logged in ho
    console.log(req.user);    //ye login krne se pta chlega user ka email , bcoz humne req.user me data daal diya tha
    let user = await userModel.findOne({email: req.user.email}).populate("posts")   //isse content aajaaega post ka
    res.render("profile",{user})
})

function isloggedin(req, res, next) {
    if (req.cookies.token === "") res.redirect("/login")    //agr token blank h to phle login krna pdega(to isliye phle login krna pdega)
    else {
        let data = jwt.verify(req.cookies.token, "ananya22");   //agr ni h, to hum jo token h usko verify krenge  ki kya ye valid token h, agr hai  to ume wahi data miljaega, wo data jo humne phli baar token create krte waqt set kiya tha(let token = jwt.sign({ email: email, userid: user._id }, "ananya22"))

        req.user= data;    //req.user me daalne ki wajah se ye ptq chl jaega ki kon logged in h
        next();
    }
   
    

}

app.post("/post" , isloggedin , async(req,res)=>{   //hum post create tbhi krenge jb logged in ho 
    let user = await userModel.findOne({email: req.user.email})
    let {content}= req.body
    let post = await postModel.create({
        user: user._id,    //post ko btaaya ki konsa user hai jo post create krre hai
        content: content
    })

    user.posts.push(post._id);  //phir us post ko user ke posts array me push krdia
    await user.save();    //then user ko save krdia
    
    res.redirect("/profile")
})



app.get("/like/:id" , isloggedin , async(req,res)=>{   
   
    let post = await postModel.findOne({_id: req.params.id}).populate("user")   //isse user aajaaega post like krne pe

    if(post.Likes.indexOf(req.user.userid)===-1){    //agr us user ne like ni kraa haii, to like cnt badha denge
        post.Likes.push(req.user.userid);
    }
    else{
        post.Likes.splice(post.Likes.indexOf(req.user.userid),1);    //ag  already like kra h, to click krne pe unlike hojaega, like cnt 1 kam hojaaega 
    }
    
    await post.save();
    res.redirect("/profile")
})


app.get("/edit/:id" , isloggedin , async(req,res)=>{   
   
    let post = await postModel.findOne({_id: req.params.id}).populate("user")      
    res.render("edit" ,{post})    ;
    
})

app.post("/update/:id" , isloggedin , async(req,res)=>{   
   
    let post = await postModel.findOneAndUpdate({_id: req.params.id},{content:req.body.content})    
    res.redirect("/profile");
    
})

app.get("/delete/:id" , isloggedin , async(req,res)=>{   
   
    let post = await postModel.deleteOne({_id: req.params.id})    
    res.redirect("/profile");
    
})
app.listen(3000)
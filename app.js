const express = require('express')
const app = express()
const userModel = require('./models/user')
const postModel = require("./models/post")
const adminModel= require("./models/admin");
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const path = require('path')
// const multer = require("multer")
const upload = require("./config/multerconfig");
// const user = require('./models/user');


app.set("view engine", "ejs")
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname,"public")))









// app.get("/", (req, res) => {
//     res.render("index")
// })

// app.post("/register", async (req, res) => {
//     let { email, password, username, name, age } = req.body;

//     //checking if the user already exists with this email before regstering or creating a new user
//     let user = await userModel.findOne({ email })
    
//     if (user) return res.status(500).redirect("/login");

//     bcrypt.genSalt(10, (err, salt) => {
//         bcrypt.hash(password, salt, async (err, hash) => {
//             let user = await userModel.create({
//                 username, email, age, name, password: hash
//             })
//             let token = jwt.sign({ email: email, userid: user._id }, process.env.JWT_SECRET_KEY)
//             res.cookie("token", token)
//             res.redirect("/profile")
            


//         })


//     })
// })

// app.get("/login", (req, res) => {
//     res.render("login");
// })

// app.post("/login", async (req, res) => {
//     let { email, password } = req.body;

//     //checking if the user already exists with this email before regstering or creating a new user
//     let user = await userModel.findOne({ email })
//     if (!user) return res.status(500).send("Something went wrong");
//     bcrypt.compare(password, user.password, function (err, result) {
//         //if password is correct
//         if (result) {
//             let token = jwt.sign({ email: email, userid: user._id },process.env.JWT_SECRET_KEY)
//             res.cookie("token", token)
//             res.status(200).redirect("/profile");

//         }
//         else res.redirect("/login")
//     })
// })



app.get("/", (req, res) => {
    res.render("index");
});

// Registration Route
app.post("/register", async (req, res) => {
    let { email, password, username, name, age } = req.body;

    // Check if the user already exists
    let existingUser = await userModel.findOne({ email });
    if (existingUser) return res.status(400).send("User already exists. Please login.");

    // Hash password
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        let newUser = await userModel.create({
            username, email, age, name, password: hashedPassword
        });
        
        // Generate JWT token
        let token = jwt.sign({ email: newUser.email, userid: newUser._id }, process.env.JWT_SECRET_KEY);
        
        // Set token in cookie
        res.cookie("token", token, {
            httpOnly: true,  // Helps mitigate XSS attacks
            secure: process.env.NODE_ENV === "production", // Ensures secure cookies in production
            sameSite: "Strict", // Helps mitigate CSRF attacks
        });

        // Redirect to profile
        res.redirect("/profile");
    } catch (err) {
        res.status(500).send("Server error during registration");
    }
});

// Login Route
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    let { email, password } = req.body;

    try {
        // Find user by email
        let user = await userModel.findOne({ email });
        if (!user) return res.status(404).send("User not found");

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (isPasswordCorrect) {
            // Generate JWT token with expiry
            let token = jwt.sign({ email: user.email, userid: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

            // Set token in cookie
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // Secure in production
                sameSite: "Strict",
            });

            // Redirect to profile
            res.status(200).redirect("/profile");
        } else {
            res.status(401).send("Incorrect password");
        }
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).send("Server error during login");
    }
});



// Admin Registration Route
app.get('/admin/register', (req, res) => {
    res.render('adminRegister'); 
});

app.post('/admin/register', async (req, res) => {
    const { email, password, name, secretKey } = req.body;

    if (!email || !password || !name || !secretKey) {
        return res.status(400).send("All fields are required.");
    }

    if (secretKey !== process.env.ADMIN_KEY) {
        return res.status(403).send("Unauthorized: Invalid secret key");
    }

    let admin = await adminModel.findOne({ email });
    if (admin) return res.status(400).redirect('/admin/login'); 

    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return res.status(500).send("Error generating salt");
        }

        bcrypt.hash(password, salt, async (err, hash) => {
            if (err) {
                return res.status(500).send("Error hashing password");
            }

            await adminModel.create({
                name,
                email,
                password: hash,
            });

            res.redirect('/admin/login'); 
        });
    });
});






// Admin Login Route
app.get('/admin/login', (req, res) => {
    res.render('adminLogin'); 
});

app.post('/admin/login', async (req, res) => {
    let { email, password } = req.body;

    // Verify admin credentials
    let admin = await adminModel.findOne({ email });
    if (!admin) return res.status(400).send('Admin not found');

    bcrypt.compare(password, admin.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: admin.email, adminid: admin._id }, process.env.ADMIN_SECRET_KEY);
            // res.cookie('adminToken', token); 
            res.cookie('adminToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 1000 * 60 * 60 * 24,
                sameSite: 'Strict'
            });

            res.redirect('/admin/dashboard'); 
        } else {
            res.redirect('/admin/login'); 
        }
    });
});


// Middleware to verify admin login
function isAdminLoggedIn(req, res, next) {
    if (!req.cookies.adminToken) return res.redirect('/admin/login'); // Check if token exists
    try {
        let data = jwt.verify(req.cookies.adminToken, process.env.ADMIN_SECRET_KEY); // Verify the token
        req.admin = data; // Set admin data to request object
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.redirect('/admin/login'); // Redirect if token is invalid
    }
}

// Admin dashboard route
app.get('/admin/dashboard', isAdminLoggedIn, async (req, res) => {
    try {
        // Fetch all users and their posts
        const users = await userModel.find()  // Use the correct model here
            .populate('posts') // Populate the 'posts' field if it references another model
            .exec(); // Execute the query

        // Pass users and admin data to the EJS template
        res.render('adminDashboard', { users, admin: req.admin });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});




app.get("/logout", async (req, res) => {
    res.cookie("token", "");
    res.redirect("/login")
})


app.get("/profile", isloggedin, async (req, res) => {   //hum profile pe tbhi jaa skte hai, jb logged in ho
    console.log(req.user);    //ye login krne se pta chlega user ka email , bcoz humne req.user me data daal diya tha
    let user = await userModel.findOne({ email: req.user.email }).populate("posts")   //isse content aajaaega post ka
    res.render("profile", { user })
})

function isloggedin(req, res, next) {
    if (req.cookies.token === "") res.redirect("/login")    //agr token blank h to phle login krna pdega(to isliye phle login krna pdega)
    else {
        let data = jwt.verify(req.cookies.token, process.env.JWT_SECRET_KEY);   //agr ni h, to hum jo token h usko verify krenge  ki kya ye valid token h, agr hai  to ume wahi data miljaega, wo data jo humne phli baar token create krte waqt set kiya tha(let token = jwt.sign({ email: email, userid: user._id }, "ananya22"))

        req.user = data;    //req.user me daalne ki wajah se ye ptq chl jaega ki kon logged in h
        next();
    }



}

app.post("/post", isloggedin, async (req, res) => {   //hum post create tbhi krenge jb logged in ho 
    let user = await userModel.findOne({ email: req.user.email })
    let { content } = req.body
    let post = await postModel.create({
        user: user._id,    //post ko btaaya ki konsa user hai jo post create krre hai
        content: content
    })

    user.posts.push(post._id);  //phir us post ko user ke posts array me push krdia
    await user.save();    //then user ko save krdia

    res.redirect("/profile")
})



app.get("/like/:id", isloggedin, async (req, res) => {

    let post = await postModel.findOne({ _id: req.params.id }).populate("user")   //isse user aajaaega post like krne pe

    if (post.Likes.indexOf(req.user.userid) === -1) {    //agr us user ne like ni kraa haii, to like cnt badha denge
        post.Likes.push(req.user.userid);
    }
    else {
        post.Likes.splice(post.Likes.indexOf(req.user.userid), 1);    //ag  already like kra h, to click krne pe unlike hojaega, like cnt 1 kam hojaaega 
    }

    await post.save();
    res.redirect("/profile")
})


app.get("/edit/:id", isloggedin, async (req, res) => {

    let post = await postModel.findOne({ _id: req.params.id }).populate("user")
    res.render("edit", { post });

})

app.post("/update/:id", isloggedin, async (req, res) => {

    let post = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content })
    res.redirect("/profile");

})

app.get("/delete/:id", isloggedin, async (req, res) => {

    let post = await postModel.deleteOne({ _id: req.params.id })
    res.redirect("/profile");

})






app.get("/profile/upload",(req,res)=>{
    res.render("profileupload")
})

app.post("/upload", isloggedin, upload.single("image"),async(req,res)=>{
    let user  = await userModel.findOne({email:req.user.email})
    user.profilepic = req.file.filename;
    await user.save()
    res.redirect("profile")



})
// app.listen(3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

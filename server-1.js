const express = require('express'),
      mysql = require('mysql2'),
      hbs = require('hbs'),
      fs = require('fs'),
      flash = require('express-flash'),
      fileUpload = require('express-fileupload'),
      bodyParser = require('body-parser'),
      session = require('express-session'),
      app = express();


app.set('views', './views');
app.set('view engine', 'pug');

app.use(express.static('assets'));
app.use(fileUpload());
app.use(flash());

var db = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'db_tugas56'
})

app.use(session({
  	secret: 'secret',
  	resave: true,
  	saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.message = req.flash();
    next();
});

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
      	if (req.session.loggedin) {
            auth = {
              name : req.session.name,
              yesOrno : true
            }
        }else {
            auth = {
              name : 'Guest',
              yesOrno : false
            }
        }
    db.query('SELECT * FROM specials INNER JOIN products ON specials.id_product = products.id', (error, rows, result) => {
        if (error) throw error;
        var special = [];var no = 0;
        for (let u = 0; u < rows.length; u++) {
            var specials = {
                'no'          : ++no,
                'name'        : rows[u].name,
                'type'        : rows[u].type,
                'price'       : rows[u].price,
                'desc'        : rows[u].description,
                'ingredients' : rows[u].ingredients,
                'promo'       : rows[u].promo,
                'id_product'  : rows[u].id_product,
                'id_special'  : rows[u].id_special,
                'photo'       : rows[u].photo
            };
            special.push(specials);
        }
            db.query('SELECT * FROM products', function (error, rows, result) {
                if (error) throw error;
                var product = [];var no = 0;
                for (let i = 0; i < rows.length; i++) {
                    var products = {
                        'no'          : ++no,
                        'name'        : rows[i].name,
                        'type'        : rows[i].type,
                        'price'       : rows[i].price,
                        'desc'        : rows[i].description,
                        'ingredients' : rows[i].ingredients,
                        'id_product'  : rows[i].id,
                        'photo'       : rows[i].photo
                    };
                    product.push(products);
                }
                res.render('main', {productss : product, specialss : special, auth : auth} )
            })
    })
})

app.get('/login', (req, res) => {

    if (req.session.loggedin) {

        if (req.session.role === 2) {
            res.redirect('/admin')
        }else if (req.session.role === 1) {
            res.redirect('/')
        }

    }else {
        res.render('login');
        res.end()
    }
})

app.get('/reg', (req, res) => {

    if (req.session.loggedin) {

        if (req.session.role === 2) {
            res.redirect('/admin')
        }else if (req.session.role === 1) {
            res.redirect('/')
        }

    }else {
        res.render('reg');
        res.end()
    }
})

app.post('/login', (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    if (email && password) {
      db.query('SELECT * FROM users WHERE email = ? AND password = md5(?)', [email, password], function(error, result, fields) {
        if (result.length > 0) {
            req.session.loggedin = true;
            var role = result[0].role;
            var name = result[0].name;
            req.session.email = email;
            req.session.role = role;
            req.session.name = name;
            if (role === 1) {
                // main user page
                res.redirect('/');
            } else if (role === 2) {
                // admin page
                res.redirect('/admin');
            }else {
                res.end('User access not found');
            }
        } else {
          req.flash('msg_e', `Incorrect Username and/or Password!`)
          res.redirect('/login')
        }
      })
      } else {
        req.flash('msg_e', 'Please enter Username and Password!')
        res.redirect('/login')
      }
})

app.post('/reg', (req, res) => {

      var name = req.body.name;
      var email = req.body.email;
      var password = req.body.password;
      if (email && password) {
          db.query('SELECT * FROM users WHERE email = ?', email, function(error, result, fields) {
            if (result.length > 0) {
              req.flash('msg_e', `This Email : '${email}', is has been used !`)
              res.redirect('/reg')
            } else {
                  var sqlinsert = `INSERT INTO users VALUES( null , ? , ? , md5(?) , 1)`;
                  var params = [name,email,password];

                  db.query(sqlinsert, params, (error, result) => {
                        if (error) {
                              // console.log('Penambahan Data gagal dibuat')
                              throw error;
                          }
                          // console.log('Penambahan Data  berhasil dibuat')
                          req.flash('msg_s', 'Account has been created successfully!')
                          res.redirect('/login')
                  })
            }
          })
      }else {
          req.flash('msg_e', `Email and/or Password doesn't exist`)
          res.redirect('/reg')
      }

})

app.get('/admin', (req, res) => {
  if (req.session.loggedin) {

      if (req.session.role === 2) {

          db.query('SELECT * FROM users WHERE role = 1', function (error, rows, fields) {
            if (error) {
              throw error
            }
            var user = [];var no = 0;
            var name = req.session.name;
            for (let index = 0; index < rows.length; index++) {
                var users = {
                    'no': ++no,
                    'name':rows[index].name,
                    'email':rows[index].email,
                    'id_user':rows[index].id
                };

                user.push(users);
            }
            res.render('admin', {userss : user, name : name})
            res.end();
          })

      }else if (req.session.role === 1) {
          res.redirect('/')
      }

  }else {
      res.redirect('/login')
  }

})

app.post('/updateUser', (req, res) => {
  if (req.session.loggedin) {

      if (req.session.role === 2) {

          var id_user = req.body.id_user;
          var name = req.body.name;
          var sql = 'UPDATE users SET name=? WHERE id=?';
          db.query(sql, [name, id_user], function (error, result) {
              if (error) throw error
              // kode untuk direct ke root
              res.redirect('/admin')
          })

      }else if (req.session.role === 1) {
          res.redirect('/')
      }

  }else {
      res.redirect('/login')
  }

})

app.post('/deleteUser', (req, res) => {

  if (req.session.loggedin) {

        if (req.session.role === 2) {

            var id_user = req.body.id_user;
            var sql = 'DELETE FROM users WHERE id = ?';
            db.query(sql, id_user, function (error, result) {
                if (error) {
                    throw error
                }
                // kode untuk direct ke root
                res.redirect('/admin')
            })

        }else if (req.session.role === 1) {
            res.redirect('/')
        }

    }else {
        res.redirect('/login')
    }

})

app.get('/products', (req, res) => {
  if (req.session.loggedin) {

      if (req.session.role === 2) {

          db.query('SELECT * FROM products', function (error, rows, result) {
              if (error) {
                throw error
              }
              var product = [];var no = 0;
              for (let i = 0; i < rows.length; i++) {
                  var products = {
                      'no'          : ++no,
                      'name'        : rows[i].name,
                      'type'        : rows[i].type,
                      'price'       : rows[i].price,
                      'desc'        : rows[i].description,
                      'ingredients' : rows[i].ingredients,
                      'id_product'  : rows[i].id,
                      'photo'       : rows[i].photo
                  };
                  product.push(products);
              }
              res.render('products', {productss : product})
              res.end();
          })

      }else if (req.session.role === 1) {
          res.redirect('/')
      }

  }else {
      res.redirect('/login')
  }

})

app.post('/products', (req, res) => {
  if (req.session.loggedin) {

      if (req.session.role === 2) {

              var post        = req.body,
                  name        = post.name,
                  desc        = post.desc,
                  ingredients = post.ingredients,
                  price       = post.price,
                  type        = post.type;
              // console.log(req.files);
                db.query(`SELECT * FROM products WHERE name=?`, name, (error, result) => {
                    if (error) res.send(error)

                        if (result.length > 0){
                            req.flash('msg_e', `A product with this name : '${name}' already exists`)
                            res.redirect('/products')
                        }else {

                              if (req.files){
                                  var file = req.files.photo;
                                  var img_name = file.name;
                                  var date = Date.now();
                                  var filename = date + '-' + file.name;
                                  var params = [name, desc, ingredients, price, type, filename];

                                  if(file.mimetype == "image/jpeg"|| file.mimetype == "image/jpg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" ){
                                    file.mv('assets/images/photo_products/'+filename, (err) => {
                                      if (err) return res.status(500).send(err);
                                      var sql = "INSERT INTO products VALUES (null,?,?,?,?,?,?)";
                                      db.query(sql, params, (err, result) => {
                                        req.flash('msg_s', 'Product added successfully')
                                        res.redirect('/products');
                                      });
                                    })

                                  } else {
                                    req.flash('msg_e', `This format is not allowed , please upload file with '.png','.gif','.jpg'`)
                                    res.redirect('/products')
                                  }

                              }else {
                                req.flash('msg_e', 'No files were uploaded. Product photo is required')
                                res.redirect('/products');

                              }

                        }

                })

      }else if (req.session.role === 1) {
        res.redirect('/')
      }

  }else {
      res.redirect('/login')
  }

})

app.post('/delProducts', (req, res) => {
  if (req.session.loggedin) {

        if (req.session.role === 2) {

              var id_product = req.body.id_product;
              var photo_product = req.body.photo_product;
              var sql = 'DELETE FROM products WHERE id = ?';
              db.query(sql, id_product, function (error, result) {
                  if (error) return res.status(400).send('Error here.')

                  // delete photo
                  path = `./assets/images/photo_products/${photo_product}`;
                    try {
                      //file removed
                      fs.unlinkSync(path)
                      req.flash('msg_s', 'Product has been successfully deleted')
                      // kode untuk direct ke root
                      res.redirect('/products')
                    } catch(err) {
                      console.error(err)
                    }
              })

        }else if (req.session.role === 1) {
            res.redirect('/')
        }

  }else {
      res.redirect('/login')
  }

})

app.post('/updateProduct', (req, res) => {
    if (req.session.loggedin) {

        if (req.session.role === 2) {


          var post        = req.body;
              id_product  = post.id_product,
              name        = post.name,
              desc        = post.desc,
              ingredients = post.ingredients,
              price       = post.price,
              price       = post.price,
              type        = post.type,
              photo_lama  = post.photo_lama;

              db.query(`SELECT * FROM products WHERE name=? AND id!=?`, [name,id_product], (error, result) => {
                  if (error) res.send(error)

                      if (result.length > 0){
                          req.flash('msg_e', `A product with this name : '${name}' already exists`)
                          res.redirect('/products')
                      }else {

                            if (req.files) {
                                var file = req.files.photo;
                                var img_name = file.name;
                                var date = Date.now();
                                var filename = date + '-' + file.name;
                                var params = [name, desc, ingredients, price, type, filename, id_product];

                                  if(file.mimetype == "image/jpeg"|| file.mimetype == "image/jpg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" ){
                                        file.mv('assets/images/photo_products/'+filename, (err) => {
                                          if (err) return res.status(500).send(err);

                                                var sql = `UPDATE products SET name = ?, description = ?, ingredients = ?, price =?, type = ?, photo = ? WHERE id = ?`;
                                                db.query(sql, params, function (error, result) {
                                                  if (error) return res.status(400).send('Error here.')

                                                  // delete photo
                                                  path = `./assets/images/photo_products/${photo_lama}`;
                                                  try {
                                                    fs.unlinkSync(path)
                                                    // kode untuk direct ke root
                                                    req.flash('msg_s', 'Product updated successfully')
                                                    res.redirect('/products')
                                                    //file removed
                                                  } catch(err) {
                                                    console.error(err)
                                                  }
                                                })

                                            });
                                        }else {
                                            req.flash('msg_e', `This format is not allowed , please upload file with '.png','.gif','.jpg'`)
                                            res.redirect('/products')
                                        }

                                }else {
                                      var params = [name, desc, ingredients, price, type, id_product];
                                      var sqlupdatenonphoto = "UPDATE products SET name=?, description=?, ingredients=?, price=?, type=? WHERE id=?";
                                      db.query(sqlupdatenonphoto, params, (error, result) => {

                                        if (error) return res.status(400).send(error)
                                            req.flash('msg_s', 'Product updated successfully')
                                            res.redirect('/products')

                                      })
                                }
                    }
            })


        }else if (req.session.role === 1) {
            res.redirect('/')
        }

    }else {
        res.redirect('/login')
    }


})

app.get('/profile', (req, res) => {

    if (req.session.loggedin) {

        if (req.session.role === 2) {

              db.query('SELECT * FROM specials INNER JOIN products ON specials.id_product = products.id', (error, rows, result) => {
                if (error) throw error;
                var special = [];var no = 0;
                for (let u = 0; u < rows.length; u++) {
                  var specials = {
                    'no'          : ++no,
                    'name'        : rows[u].name,
                    'type'        : rows[u].type,
                    'price'       : rows[u].price,
                    'desc'        : rows[u].description,
                    'ingredients' : rows[u].ingredients,
                    'promo'       : rows[u].promo,
                    'id_product'  : rows[u].id_product,
                    'id_special'  : rows[u].id_special,
                    'photo'       : rows[u].photo
                  };
                  special.push(specials);
                }
                db.query('SELECT * FROM products WHERE NOT EXISTS (SELECT * FROM specials WHERE products.id = specials.id_product)', (error, rows, result) => {
                  if (error) throw error;
                  var product = [];var no = 0;
                  for (let i = 0; i < rows.length; i++) {
                    var products = {
                      'no'          : ++no,
                      'name'        : rows[i].name,
                      'type'        : rows[i].type,
                      'price'       : rows[i].price,
                      'id_product'  : rows[i].id,
                      'photo'       : rows[i].photo
                    };
                    product.push(products);
                  }
                  res.render('profile', {productss : product, specialss : special} )
                  res.end()

                })
              })

        }else if (req.session.role === 1) {
            res.redirect('/')
        }
    }else {
      res.redirect('/login')
    }

})

app.post('/addSpecial', (req, res) => {
    if (req.session.loggedin) {

        if (req.session.role === 2) {
            var post = req.body, id_product = post.id_product, promo = post.promo;
            db.query(`INSERT INTO specials VALUES (null,?,?)`, [id_product,promo], (err, result) => {
              if(err) throw err;
              req.flash('msg_s', 'Product successfully entered specials')
              res.redirect('/profile')
            })
        }else if (req.session.role === 1) {
            res.redirect('/')
        }
    }else {
      res.redirect('/login')
    }
})

app.post('/delSpecial', (req, res) => {
    if (req.session.loggedin) {

        if (req.session.role === 2) {
            var post = req.body, id_special = post.id_special;
            db.query(`DELETE FROM specials WHERE id_special = ${id_special}`, (err, result) => {
              req.flash('msg_s', 'Product successfully deleted from specials')
              res.redirect('/profile');
            })
        }else if (req.session.role === 1) {
            res.redirect('/')
        }

    }else {
      res.redirect('/login')
    }

})

app.get('/logout', (req, res) => {
    if (req.session.loggedin) {
      req.session.destroy();
    }
    res.redirect('/login')
})

app.get('*', (req,res) => {
    res.render('404')
    res.end()
})

app.listen(3000, () => {
  console.log('Server is running at localhost:3000');
})

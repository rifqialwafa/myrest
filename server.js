var http = require('http');
var Client = require('mysql2');
var pug = require('pug');
var qs = require('querystring');
var NodeSession = require('node-session');
var url = require('url')
const mv = require('mv');
const formidable = require('formidable');

var mainPug = "./views/main.pug";
var adminPug = "./views/admin.pug";
var prodPug = "./views/products.pug";
var loginPug = "./views/login.pug";
var regPug = "./views/reg.pug";


var db = Client.createConnection({
  host : 'localhost',
  user : 'root',
  password : '',
  database : 'db_tugas56'
});

// membuat session
var session = new NodeSession({
    secret: 'Q3UBzdH9GEfiRCTKbi5MTPyChpzXLsTD'

});


var server = http.createServer(function (request, response) {

    session.startSession(request, response , function () {
        if (request.url === "/") {
          if (!request.session.has('email')) {
            response.writeHead(200, {"Content-Type": "text/html"});
            var template = pug.renderFile(loginPug);
            response.end(template);
          }else {
            // redirect ke main
            response.writeHead(302, {'Location':'/main'});
            response.end();
          }

        } else if(request.url === "/login" && request.method === "POST") {

            var body = '';

            request.on('data', function (data) {
                body += data;
            });

            request.on('end', function () {

                var form = qs.parse(body);
                var params = [
                    form['email'],
                    form['password']
                ];

                var sql = `SELECT * FROM users WHERE email = ? AND password = md5(?)`;

                db.query(sql, params, function (error, result) {

                    if (error) {
                        throw error;
                    }
                    // console.log(`Nilai n adalan ${n}`);
                    // console.log(result[0].role);
                    if (result.length > 0) {

                      var role = result[0].role;
                      var name = result[0].name;
                      request.session.put("email", params[0]);
                      request.session.put("name", name);

                        if (role === 1) {
                            // main user page
                            request.session.put("role", role);
                            response.writeHead(302,{'Location' : '/main'});
                            response.end();
                        } else if (role === 2) {
                            // admin page
                            request.session.put("role", role);
                            response.writeHead(302,{'Location' : '/admin'});
                            response.end();
                        }else {
                            response.writeHead(200, {'Content-Type' : 'text/html'});
                            response.end('Akses pengguna tidak ditemukan');
                        }

                    }else {
                        response.writeHead(200, {'Content-Type' : 'text/html'});
                        var template =  pug.renderFile(loginPug, {msg : "Email atau password salah !!"});
                        response.end(template);
                    }
                });
            });

        }else if (request.url === "/admin") {

              if (!request.session.has('email')) {
                  // redirect ke form login
                  response.writeHead(302, {'Location':'/'});
                  response.end();
              }else if (request.session.has('email')) {

                  if (request.session.get('role') == 2) {
                    db.query('SELECT * FROM users WHERE role = 1', function (error, result) {
                      if (error) {
                        throw error
                      }
                      var name = request.session.get('name');
                      var no = 0;
                      var template = pug.renderFile(adminPug, {users : result, name : name, no : no})
                      response.writeHead(200, {'Content-Type' : 'text/html'});
                      response.end(template)
                    });
                  }else if (request.session.get('role') == 1) {
                      // redirect ke main user page
                      response.writeHead(302, {'Location':'/main'});
                      response.end();
                  }else {
                    // redirect ke login page
                    response.writeHead(302, {'Location':'/logout'});
                    response.end();
                  }

              }

        }else if (url.parse(request.url).pathname === '/update' && request.method === "POST") {
            if (!request.session.has('email')) {
                // redirect ke form login
                response.writeHead(302, {'Location':'/'});
                response.end();
            }else if (request.session.has('email')) {

                if (request.session.get('role') == 2) {
                    // console.log('test');
                    var body = ''

                    request.on('data', function (data) {
                        body += data
                    })

                    request.on('end', function () {
                        var form = qs.parse(body)
                        var params = [
                            form['name'],
                            form['id']
                        ];

                        var sql = `
                            UPDATE users SET name=? WHERE id=?
                        `;
                        db.query(sql,params, function (error, result) {
                            if (error) {
                                throw error
                            }
                            // kode untuk direct ke root
                            response.writeHead(302,{'Location' : '/'})
                            response.end();
                        })
                    })

                }else if (request.session.get('role') == 1) {
                    // redirect ke main user page
                    response.writeHead(302, {'Location':'/main'});
                    response.end();
                }else {
                  // redirect ke login page
                  response.writeHead(302, {'Location':'/logout'});
                  response.end();
                }

            }
        }else if (url.parse(request.url).pathname === '/delete') {
            if (!request.session.has('email')) {
                // redirect ke form login
                response.writeHead(302, {'Location':'/'});
                response.end();
            }else if (request.session.has('email')) {

                if (request.session.get('role') == 2) {

                    var id = qs.parse(url.parse(request.url).query).id;
                    var sql = 'DELETE FROM users WHERE id = ?';
                    db.query(sql,[id], function (error, result) {
                        if (error) {
                            throw error
                        }
                        // kode untuk direct ke root
                        response.writeHead(302,{'Location' : '/'})
                        response.end();
                    })

                }else if (request.session.get('role') == 1) {
                    // redirect ke main user page
                    response.writeHead(302, {'Location':'/main'});
                    response.end();
                }else {
                  // redirect ke login page
                  response.writeHead(302, {'Location':'/logout'});
                  response.end();
                }

            }
        }else if (request.url === "/products" && request.method === "GET") {

            if (!request.session.has('email')) {
                // redirect ke form login
                response.writeHead(302, {'Location':'/'});
                response.end();
            }else if (request.session.has('email')) {

                  if (request.session.get('role') == 2) {
                    db.query('SELECT * FROM products', function (error, result) {
                      if (error) {
                        throw error
                      }
                      var no = 0;
                      var template = pug.renderFile(prodPug, {products : result, no : no})
                      response.writeHead(200, {'Content-Type' : 'text/html'});
                      response.end(template)
                    });

                  }else if (request.session.get('role') == 1) {
                      // redirect ke main user page
                      response.writeHead(302, {'Location':'/main'});
                      response.end();
                  }else {
                    // redirect ke login page
                    response.writeHead(302, {'Location':'/logout'});
                    response.end();
                  }
            }

        }else if (request.url === "/products" && request.method === "POST") {

              if (!request.session.has('email')) {
                  // redirect ke form login
                  response.writeHead(302, {'Location':'/'});
                  response.end();
              }else if (request.session.has('email')) {

                    if (request.session.get('role') == 2) {


                        var body = '';

                        request.on('data', function (data) {
                            body += data;
                        })
                        request.on('end', function () {
                          var sql = `SELECT * FROM products WHERE name = ?`;
                          var form = qs.parse(body);
                          var params = form['name'];

                          db.query(sql, params, function (error, result) {

                              if (error) {
                                  throw error;
                              }

                              if (result.length > 0) {
                                console.log('sudah ada');
                                response.writeHead(302, {'Location' : '/products'});
                                response.end();

                              } else {
                                    console.log('datanya belum ada');

                                      var formfile = new formidable.IncomingForm();
                                      // console.log(formfile);
                                      formfile.parse(request, function (err, fields, files) {
                                        console.log('ini masuk ke form parse');
                                        if (err) {
                                          console.log(err);
                                        }
                                          // mengambil nama file temporary nya
                                          var tempFile = files.photo.path;

                                          var date = Date.now();
                                          console.log(date);

                                          // menentukan tujuan file
                                          var destFile = './uploads/'+ date + '-' + files.photo.name;

                                          console.log(destFile);
                                          // memindahkan file temporary ke tujuan uploads
                                          mv(tempFile, destFile, function (error) {
                                              if (error) {
                                                  response.end('Proses Upload gagal !'); throw error;
                                              } else {
                                                  response.end('Process Upload berhasil')
                                              }
                                          })
                                      })

                                // var sqlinsert = `INSERT INTO users VALUES( null , ? , ? , md5(?) , 1)`;
                                // var params = [
                                //       form['name'],
                                //       form['email'],
                                //       form['password']
                                //   ];

                                // db.query(sqlinsert, params, function (error, result) {
                                //       if (error) {
                                //             console.log('Penambahan Data gagal dibuat')
                                //             throw error;
                                //         }
                                //         console.log('Penambahan Data  berhasil dibuat');
                                //     })
                                  console.log('kelewat');
                                    response.writeHead(302, {'Location' : '/products'});
                                    response.end();

                              }
                          });
                        })


                    }else if (request.session.get('role') == 1) {
                        // redirect ke main user page
                        response.writeHead(302, {'Location':'/main'});
                        response.end();
                    }else {
                      // redirect ke login page
                      response.writeHead(302, {'Location':'/logout'});
                      response.end();
                    }
              }
        } else if (request.url === "/main") {

            if (!request.session.has('email')) {
              // redirect ke form login
              response.writeHead(302, {'Location':'/'});
              response.end();
            }else if (request.session.has('email')) {

              if (request.session.get('role') == 1) {
                db.query('SELECT * FROM users', function (error, result) {
                    if (error) {
                        throw error
                    }
                    var email = request.session.get('email');
                    var no = 0;
                    var template = pug.renderFile(mainPug, {users : result, email : email, no : no})
                    response.writeHead(200, {'Content-Type' : 'text/html'});
                    response.end(template)
                });
              }else if (request.session.get('role') == 2) {
                  // redirect ke main user page
                  response.writeHead(302, {'Location':'/admin'});
                  response.end();
              }else {
                // redirect ke login page
                response.writeHead(302, {'Location':'/logout'});
                response.end();
              }

            }

        } else if (request.url === "/reg" && request.method === "GET") {
          if (!request.session.has('email')) {
            response.writeHead(200, {"Content-Type": "text/html"});
            var template = pug.renderFile(regPug);
            response.end(template);
          }else if (request.session.has('email')) {
            // redirect ke main
            response.writeHead(302, {'Location':'/main'});
            response.end();
          }

        } else if (request.url === "/reg" && request.method === "POST") {

          var body = '';

          request.on('data', function (data) {
              body += data;
          })
          request.on('end', function () {
            var sql = `SELECT COUNT(*) AS cnt FROM users WHERE email = ?`;
            var form = qs.parse(body);
            var params = form['email'];

            db.query(sql, params, function (error, result) {

                if (error) {
                    throw error;
                }
                var n = result[0]['cnt'];
                // console.log(`Nilai n adalan ${n}`);

                if (n > 0) {

                  response.writeHead(200, {'Content-Type' : 'text/html'});
                  var template =  pug.renderFile(regPug, {msg : "Email sudah digunakan !!"});
                  response.end(template);

                } else {

                  var sqlinsert = `INSERT INTO users VALUES( null , ? , ? , md5(?) , 1)`;
                  var params = [
                        form['name'],
                        form['email'],
                        form['password']
                    ];

                  db.query(sqlinsert, params, function (error, result) {
                        if (error) {
                              console.log('Penambahan Data gagal dibuat')
                              throw error;
                          }
                          console.log('Penambahan Data  berhasil dibuat');
                      })

                      response.writeHead(302, {'Location' : '/'});
                      response.end();

                }
            });
          })

        } else if (request.url === "/logout") {

            if (request.session.has('email')) {
                request.session.forget('email');
                request.session.forget('role');
            }

            // direcct ke login
            response.writeHead(302, {'Location' : '/'});
            response.end();


        } else {
            response.writeHead(200, {'Content-Type' : 'text/html'});
            response.end('Halaman tidak ditemukan');
        }

    });
});

server.listen(3000, function () {
  console.log('Running!!!')
});

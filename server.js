const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
//const upload = multer({ dest: 'uploads/' });

//настраиваем сохранение файла с оригинальным именем
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  });
  
  const upload = multer({ storage: storage });


//путь для сохранения файлов
app.use('/uploads', express.static('uploads'));

//html страничка 
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

 
//загрузка файла на сервер
app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    const comment = req.body.comment;

    if (!file || !comment) {
        res.status(400).send('Ошибка при загрузке файла. Проверьте введенные данные');
        return;
    }

    const response = {
        filename: file.originalname,  //оригинальное имя файла
        comment: comment,    //комментарий
        url: path.join('/uploads/', file.filename) 
    };

    res.json(response);
});
 

app.listen(7280, () => {
    console.log('Сервер запущен на порту 7280');
});
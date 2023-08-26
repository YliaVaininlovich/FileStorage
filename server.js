const express = require('express');
const app = express();
const server = require('http').createServer(app);
//const io = require('socket.io')(server);
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Путь к папке для загруженных файлов
const uploadPath = __dirname + '/uploads/';

// Путь к папке для комментариев
const commentPath = __dirname + '/comments/';

// Создание папки uploads, если она не существует
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

 // Создание папки comments, если она не существует
 if (!fs.existsSync(commentPath)) {
  fs.mkdirSync(commentPath);
}

// Настройка хранилища Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const filename = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, filename);
  }
});

// Создание экземпляра Multer
const upload = multer({ storage: storage });

// Разрешение статических файлов
app.use(express.static(__dirname + '/public'));

// Маршрут для корневого пути
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Маршрут для загрузки файла
app.post('/upload', upload.single('file'), (req, res) => {

  const comment = req.body.comment;
  const filename = req.file.originalname;

  // Отправка сообщения о загрузке файла через WebSocket
  //io.emit('uploadProgress', { progress: 100 });
 // broadcastProgress(100);
  broadcastProgress({ progress: 100 });
  
  // Сохранение комментария в отдельный файл
  const filenameComment = Buffer.from(filename, 'latin1').toString('utf8')
  const commentFilePath = path.join(commentPath, `${filenameComment}.txt`);
  fs.writeFileSync(commentFilePath, comment);

  res.send('Файл успешно загружен!');
});

// Маршрут для получения списка файлов
app.get('/files', (req, res) => {
  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).send('Произошла ошибка сервера');
    } else {
      const fileList = files.map(filename => {
        const commentFilePath = commentPath + filename + '.txt';;
        let comment = '';

        if (fs.existsSync(commentFilePath)) {
          comment = fs.readFileSync(commentFilePath, 'utf-8');
        }

        return {
          filename: filename,
          comment: comment
        };
      });
      res.json(fileList);
    }
  });
});

// Маршрут для скачивания файла
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = uploadPath + filename;

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error(err);
      res.status(404).send('Файл не найден');
    }
  });
});

//----------WebSocket-------------------------

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Новое соединение WebSocket');

  // Обработка сообщений от клиента
  ws.on('message', (message) => {
    console.log('Получено сообщение от клиента:', message);
  });

  // Обработка закрытия соединения клиентом
  ws.on('close', () => {
    console.log('Соединение WebSocket закрыто');
  });
});

// Функция для отправки сообщения о прогрессе загрузки файла клиентам
function broadcastProgress(progress) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ progress }));
    }
  });
}
//-----------------------------------------------------

// Запуск сервера
const port = 7280;
server.listen(port, () => {
  console.log('Сервер запущен на порту ' + port);
});
window.onload = function () {
  const socket = io("https://mybookspace-chat.up.railway.app"); // Use your actual URL

  const field = document.getElementById('field');
  const sendButton = document.getElementById('send');
  const content = document.getElementById('content');
  const nameInput = document.getElementById('name');
  const recipientSelect = document.getElementById('recipient');

  let username = '';

  nameInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      const inputName = nameInput.value.trim();
      if (inputName) {
        username = inputName;
        socket.emit('register', username);
        nameInput.disabled = true;
      } else {
        alert("Please enter your name.");
      }
    }
  });

  sendButton.onclick = function () {
    const text = field.value.trim();
    const recipient = recipientSelect.value;

    if (!username) {
      alert("Enter your name first.");
      return;
    }

    if (text !== '') {
      socket.emit('send', {
        message: text,
        username,
        to: recipient || null
      });
      field.value = '';
    }
  };

  field.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      sendButton.click();
    }
  });

  socket.on('message', function (data) {
    appendMessage(`${data.username || 'Server'}: ${data.message}`);
  });

  socket.on('private', function (data) {
    appendMessage(`🔒 ${data.from} (private): ${data.message}`);
  });

  socket.on('userList', function (userList) {
    recipientSelect.innerHTML = '<option value="">Everyone (Public)</option>';
    userList.forEach(user => {
      if (user !== username) {
        const opt = document.createElement('option');
        opt.value = user;
        opt.textContent = user;
        recipientSelect.appendChild(opt);
      }
    });
  });

  function appendMessage(msg) {
    const msgEl = document.createElement('div');
    msgEl.textContent = msg;
    content.appendChild(msgEl);
    content.scrollTop = content.scrollHeight;
  }
};

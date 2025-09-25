
const STATUS_CODE_SUCCESS = 200;
const STATUS_CODE_ERROR = 400;
const STATUS_CODE_NOT_FOUND = 404;
const NUMBER_POST_SHOW = 5;

const METHOD_GET = "GET";

// Function này sẽ nhận method, url và callback
// Callback sẽ được gọi với (error, data) theo pattern phổ biến
/*
  method: phương thức HTTP (GET, POST, PUT, DELETE...).
  url: đường dẫn API cần gọi.
  callback: hàm sẽ được gọi khi nhận dữ liệu trả về thành công.
*/
function sendRequest(method, url, callback) {
  //Tạo một đối tượng XMLHttpRequest mới(gọi tắt là xhr) dùng để gửi request HTTP từ JavaScript đến server.
  const xhr = new XMLHttpRequest();

  //Mở kết nối cho request:
  xhr.open(method, url);

  //Hàm này sẽ chạy khi request hoàn tất (server trả về response và xhr đã tải xong)
  xhr.onload = function () {
    if (this.status === STATUS_CODE_SUCCESS && this.status < STATUS_CODE_ERROR) {
      // Xử lý ví dụ nếu data mạng chậm
      setTimeout(() => {
        const responseData = JSON.parse(this.responseText);
        callback(responseData)
      }, 300);


    } else {
      console.log('this', this)
      callback(this)
    }
  }

  // Gửi request đến server. Lúc này request mới thực sự được thực thi.
  xhr.send();
}


const searchUserBtn = document.querySelector("#search-user-btn");
const userProfileCard = document.querySelector("#user-profile-card");
const userIddInput = document.querySelector("#user-id-input");
const userError = document.querySelector("#user-error");
const userErrorText = document.querySelector("#user-error-text");
const postsContainer = document.querySelector("#posts-container");
const userLoading = document.querySelector("#user-loading");
const loadTodosBtn = document.querySelector("#load-todos-btn");
const todoUserIdInput = document.querySelector("#todo-user-id-input");
const todosError = document.querySelector("#todos-error");
const todosErrorText = document.querySelector("#todos-error-text");
const todoList = document.querySelector("#todo-list");
const totalTodos = document.querySelector("#total-todos");
const completedTodos = document.querySelector("#completed-todos");
const incompleteTodos = document.querySelector("#incomplete-todos");
const todoFilters = document.querySelector("#todo-filters")
const filterBtn = document.querySelectorAll(".filter-btn")

//1.2. Implement 3 chức năng sử dụng JSONPlaceholder API

// Chức năng 1: User Profile Card
searchUserBtn.addEventListener("click", function () {
  const id = userIddInput.value;

  if (!id) {
    userError.classList.add("show")
    userErrorText.textContent = "Vui lòng nhập User ID";

    userProfileCard.classList.remove("show")
    return;
  }
  userError.classList.remove("show");
  userLoading.classList.add("show");

  sendRequest(METHOD_GET, `https://jsonplaceholder.typicode.com/users/${id}`, renderUser)
})

function renderUser(user) {
  const id = userIddInput.value;

  if (user.status > STATUS_CODE_ERROR) {
    userError.classList.add("show")
    userProfileCard.classList.remove("show")
    userErrorText.textContent = `Error Internal Server`;

    if (user.status === STATUS_CODE_NOT_FOUND) {
      userErrorText.textContent = `Không tìm thấy user với User Id = ${id}`;

    }
    return;
  }

  userLoading.classList.remove("show");
  userProfileCard.classList.add("show")


  const { username, name, email, phone, website, company, address } = user;

  const userAvatar = username && username.split("")[0];
  const companyName = company && company.name;
  const addressStreet = address && address.street;
  const addressCity = address && address.city;

  userProfileCard.innerHTML = `
  <div id="user-avatar" class="user-avatar">${userAvatar}</div>
  <div class="user-info">
    <h4 id="user-name" class="user-name">${name}</h4>
    <div class="user-details" id="user-details">
      <div class="user-detail-item">
        <span class="user-detail-label">Email:</span>
        <span id="user-email">${email}</span>
      </div>
      <div class="user-detail-item">
        <span class="user-detail-label">Phone:</span>
        <span id="user-phone">${phone}</span>
      </div>
      <div class="user-detail-item">
        <span class="user-detail-label">Website:</span>
        <span id="user-website">${website}</span>
      </div>
      <div class="user-detail-item">
        <span class="user-detail-label">Company:</span>
        <span id="user-company">${companyName}</span>
      </div>
      <div class="user-detail-item">
        <span class="user-detail-label">Address:</span>
        <span id="user-address">${addressStreet}, ${addressCity}</span>
      </div>
    </div>
  </div>`;
}

// Chức năng 2: Posts với Comments

function loadPosts(numberPost) {
  sendRequest(METHOD_GET, `https://jsonplaceholder.typicode.com/posts?_limit=${numberPost}`, (posts) => {
    if (posts && posts.length) {
      posts.forEach(post => {
        //get user by postId
        sendRequest(METHOD_GET, `https://jsonplaceholder.typicode.com//users/${post.userId}`, (user) => {
          if (!user) {
            return;
          }

          // render posts
          const postID = post.id;
          const postItem = document.createElement("div");
          postItem.className = "post-item";
          postItem.setAttribute("data-post-id", postID);
          postItem.innerHTML = `
              <h4 class="post-title">${post.title} </h4>
              <p class="post-body">${post.body}</p>
              <p class="post-author">Tác giả: <span class="author-name">${user.name} - ${user.email}</span></p>
              <button class="show-comments-btn" data-post-id="${postID}">Xem comments</button>
              <div class="comments-container" data-post-id="${postID}">
                <!-- Comments sẽ được load động -->
              </div>`;
          postsContainer.appendChild(postItem);

          // btn comment click
          const btnComment = document.querySelector(`.show-comments-btn[data-post-id="${postID}"]`);
          const commentsContainer = document.querySelector(`.comments-container[data-post-id="${postID}"]`);

          btnComment && btnComment.addEventListener("click", function () {
            sendRequest(METHOD_GET, `https://jsonplaceholder.typicode.com/posts/${postID}/comments`, (comments) => {

              //render comments
              if (comments && comments.length) {
                commentsContainer.classList.add("show")
                commentsContainer.innerHTML = comments.map(comment => (
                  `<div class="comment-item">
                  <div class="comment-author">${comment.name} - (${user.name})</div>
                  <div class="comment-email">${comment.email}</div>
                  <div class="comment-body">${comment.body}</div>
                </div>`
                ));
              }
              return;
            })
          })
        });
      });
    }
    return;
  })
}

loadPosts(NUMBER_POST_SHOW)


// Chức năng 3: Todo List với Filter
let todosData;

loadTodosBtn.addEventListener("click", function () {
  const userId = +todoUserIdInput.value;

  todoList.innerHTML = '';


  if (isNaN(userId) || userId > 10 || userId < 1) {
    todosError.classList.add("show");
    todosErrorText.textContent = "UserId không hợp lệ!";
    todosData = undefined;
    totalTodos.textContent = 0;
    completedTodos.textContent = 0;
    incompleteTodos.textContent = 0;

    return;
  }

  todosError.classList.remove("show");

  sendRequest(METHOD_GET, `https://jsonplaceholder.typicode.com/users/${userId}/todos`, (todos) => {

    const totalTodosValue = todos.length;
    todosData = todos;

    if (!todos || !totalTodosValue) {
      todosError.classList.add("show");
      todosErrorText.textContent = `Không tìm thấy todos với UserId = ${userId}`;

      totalTodos.textContent = 0;
      completedTodos.textContent = 0;
      incompleteTodos.textContent = 0;

      return;
    }

    if (todos.status > STATUS_CODE_ERROR) {
      todosError.classList.add("show")
      todosErrorText.textContent = `Error Internal Server`;

      totalTodos.textContent = 0;
      completedTodos.textContent = 0;
      incompleteTodos.textContent = 0;

      if (todos.status === STATUS_CODE_NOT_FOUND) {
        userErrorText.textContent = `Không tìm thấy todo với UserId = ${userId}`;
      }
      return;
    }

    renderTodos(todos)
  })
})

todoFilters.addEventListener("click", function (e) {
  if (!e.target.closest(".filter-btn")) {
    return;
  }


  const filterCompleted = e.target.closest("#filter-completed");
  const filterInCompleted = e.target.closest("#filter-incomplete");

  filterBtn.forEach(item => item.classList.remove("active"))
  e.target.closest(".filter-btn").classList.add("active")

  if (!todosData || !todosData.length) {
    return;
  }

  if (filterCompleted) {
    const completedTodosData = todosData.filter(todo => todo.completed === true);
    renderTodos(completedTodosData)

  } else if (filterInCompleted) {
    const incompleteTodosData = todosData.filter(todo => todo.completed === false);
    renderTodos(incompleteTodosData)
  } else {
    renderTodos(todosData)
  }


})


function renderTodos(todos) {
  const totalTodosValue = todos.length;

  const completedTodosValue = todos.filter(todo => todo.completed === true).length;
  const incompleteTodosValue = totalTodosValue - completedTodosValue;


  totalTodos.textContent = totalTodosValue;
  completedTodos.textContent = completedTodosValue;
  incompleteTodos.textContent = incompleteTodosValue;

  todoList.innerHTML = todos.map(todo => (
    `<div class="todo-item ${todo.completed ? 'completed' : 'incomplete'}" data-todo-id="${todo.id}" data-completed="${todo.completed}">
        <div class="todo-checkbox"></div>
        <div class="todo-text">${todo.title}</div>
      </div>`
  ));
  return;
}
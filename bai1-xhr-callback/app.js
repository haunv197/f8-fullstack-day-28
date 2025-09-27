
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
    // Xử lý ví dụ nếu data mạng chậm
    setTimeout(() => {
      if (this.status === STATUS_CODE_SUCCESS && this.status < STATUS_CODE_ERROR) {
        const responseData = JSON.parse(this.responseText);
        callback(null, responseData)
      } else {
        let error = {};
        if (this.status === STATUS_CODE_NOT_FOUND) {
          error = {
            message: "Không tìm thấy",
          }
        } else {
          error = {
            message: `Lỗi: ${this.status}`,
          }
        }
        callback(error, null)
      }
    }, 300);
  }

  // Gửi request đến server. Lúc này request mới thực sự được thực thi.
  xhr.send();
}


const searchUserBtn = document.querySelector("#search-user-btn");
const userProfileCard = document.querySelector("#user-profile-card");
const userIddInput = document.querySelector("#user-id-input");
const userError = document.querySelector("#user-error");
const userErrorText = document.querySelector("#user-error-text");

const postsLoading = document.querySelector("#posts-loading");
const postsError = document.querySelector("#posts-error");
const postsErrorText = document.querySelector("#posts-error-text");
const postsContainer = document.querySelector("#posts-container");

const userLoading = document.querySelector("#user-loading");
const loadTodosBtn = document.querySelector("#load-todos-btn");
const todoUserIdInput = document.querySelector("#todo-user-id-input");
const todosLoading = document.querySelector("#todos-loading");
const todosError = document.querySelector("#todos-error");
const todosErrorText = document.querySelector("#todos-error-text");
const todoList = document.querySelector("#todo-list");
const totalTodos = document.querySelector("#total-todos");
const completedTodos = document.querySelector("#completed-todos");
const incompleteTodos = document.querySelector("#incomplete-todos");
const todoFilters = document.querySelector("#todo-filters")
const filterBtn = document.querySelectorAll(".filter-btn")

//1.2. Implement 3 chức năng sử dụng JSONPlaceholder API

function ValidateUserId(userId) {
  const userIdVal = +userId;
  if (isNaN(userIdVal) || userIdVal > 10 || userIdVal < 1) {
    return {
      message: 'User Id không hợp lệ!',
      valid: false
    }
  }

  return {
    message: '',
    valid: true
  };
}


function renderUser(error, user) {
  const userId = userIddInput.value;

  // check error khi gọi api
  if (error) {
    userLoading.classList.remove("show");
    userError.classList.add("show")
    userProfileCard.classList.remove("show")
    userErrorText.textContent = `${error.message}. User Id là ${userId}`;
    return;
  }

  // Khi gọi Api thành công
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

// Chức năng 1: User Profile Card
searchUserBtn.addEventListener("click", function () {
  const userId = userIddInput.value;
  const checkUserId = ValidateUserId(userId);

  userError.classList.remove("show")

  // check userId hợp lệ hay không
  if (!checkUserId.valid) {
    userError.classList.add("show")
    userProfileCard.classList.remove("show")
    userErrorText.textContent = checkUserId.message;
    return;
  }

  // Loading khi gọi api
  userLoading.classList.add("show");
  sendRequest(METHOD_GET, `https://jsonplaceholder.typicode.com/users/${userId}`, renderUser)
})


// Chức năng 2: Posts với Comments

function renderPosts(posts, users) {
  const postListElement = posts.map(post => {
    const postID = post.id;
    const user = users.find(user => user.id === post.userId);
    return `<div class="post-item" data-post-id="${postID}">
    <h4 class="post-title">${post.title}</h4>
    <p class="post-body">${post.body}</p>
    <p class="post-author">Tác giả: <span class="author-name">${user.name} - ${user.email}</span></p>
    <button class="show-comments-btn" onclick="handleShowComment(${postID}, '${user.name}')" data-post-id="${postID}">Xem comments</button>
    <div class="comments-container" data-post-id="${postID}">
      <!-- Comments sẽ được load động -->
    </div>
    <div class="loading-spinner">
      <p>🔄 Đang tải comments...</p>
    </div> 
    <div class="error-message">
      <p class="error-message-text">Có lỗi xảy ra khi tải comments</p>
    </div>
  </div>`
  }).join("");

  postsContainer.innerHTML += postListElement;
  return;
}

function renderComments(comments, postID, userName) {
  const commentsContainer = document.querySelector(`.comments-container[data-post-id="${postID}"]`);

  if (comments && comments.length) {
    commentsContainer.classList.add("show")
    commentsContainer.innerHTML = comments.map(comment => (
      `<div class="comment-item">
        <div class="comment-author">${comment.name} - ${userName}</div>
        <div class="comment-email">${comment.email}</div>
        <div class="comment-body">${comment.body}</div>
      </div>`
    )).join("");
  }
  return;
}

function handleShowComment(postID, userName) {
  const btnComment = document.querySelector(`.show-comments-btn[data-post-id="${postID}"]`);

  const postItem = btnComment.closest(".post-item");
  const loadingSpinner = postItem.querySelector(".loading-spinner");
  loadingSpinner.classList.add("show");

  sendRequest(METHOD_GET, `https://jsonplaceholder.typicode.com/posts/${postID}/comments`, (error, comments) => {
    loadingSpinner.classList.remove("show");

    // Show error khi gọi api
    if (error) {
      const commentsError = postItem.querySelector(".error-message");
      const postsErrorText = postItem.querySelector(".error-message-text");

      commentsError.classList.add("show");
      postsErrorText.textContent = `${error.message}. Post ID là ${postID}`;
      return;
    }

    //render comments
    renderComments(comments, postID, userName)
  })
  return;
}

function loadPosts(numberPost) {
  postsLoading.classList.add("show");

  sendRequest(METHOD_GET, `https://jsonplaceholder.typicode.com/posts?_limit=${numberPost}`, (error, posts) => {
    postsLoading.classList.remove("show");
    if (error) {
      postsError.classList.add("show");
      postsErrorText.textContent = error.message;
      return;
    }

    if (posts && posts.length) {
      sendRequest(METHOD_GET, `https://jsonplaceholder.typicode.com/users`, (error, users) => {
        postsLoading.classList.remove("show");
        if (error) {
          postsError.classList.add("show");
          postsErrorText.textContent = `${error.message}`;
          return;
        }
        // render posts
        renderPosts(posts, users);
      });
    }
  })

  return;
}

loadPosts(NUMBER_POST_SHOW)


// Chức năng 3: Todo List với Filter
let todosData;

// render Todos
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
  )).join("");
  return;
}

loadTodosBtn.addEventListener("click", function () {
  const userId = todoUserIdInput.value;
  const checkUserId = ValidateUserId(userId);

  todoList.innerHTML = '';
  todosData = undefined;
  totalTodos.textContent = 0;
  completedTodos.textContent = 0;
  incompleteTodos.textContent = 0;

  todosError.classList.remove("show")

  // check userId hợp lệ hay không
  if (!checkUserId.valid) {
    todosError.classList.add("show")
    todosErrorText.textContent = checkUserId.message;
    return;
  }

  // add loading khi gọi api
  todosLoading.classList.add("show");

  sendRequest(METHOD_GET, `https://jsonplaceholder.typicode.com/users/${userId}/todos`, (error, todos) => {

    todosLoading.classList.remove("show");
    if (error) {
      todosError.classList.add("show");
      todosErrorText.textContent = `${error.message}. User Id là ${userId}`;
      return;
    }

    if (!todos || !todos.length) {
      todosError.classList.add("show");
      todosErrorText.textContent = `Không tìm thấy todos với UserId = ${userId}`;
      return;
    }

    todosData = todos;
    renderTodos(todosData)
  })
})

// filter Todos
todoFilters.addEventListener("click", function (e) {
  if (!e.target.closest(".filter-btn")) {
    return;
  }

  const filterAll = e.target.closest("#filter-all");
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
  } else if (filterAll) {
    renderTodos(todosData)
  }


})

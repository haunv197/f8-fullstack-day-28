
const STATUS_CODE_SUCCESS = 200;
const STATUS_CODE_ERROR = 400;
const STATUS_CODE_NOT_FOUND = 404;
const INIT_POST_SHOW = 0;
const NUMBER_POST_SHOW = 5;
const LIMIT_POST_SHOW = 5;

const METHOD_GET = "GET";

// Function này sẽ nhận method, url và callback
// Callback sẽ được gọi với (error, data) theo pattern phổ biến
/*
  method: phương thức HTTP (GET, POST, PUT, DELETE...).
  url: đường dẫn API cần gọi.
  callback: hàm sẽ được gọi khi nhận dữ liệu trả về thành công.
*/

async function sendRequest(method, url, retry = 0) {
  try {
    const response = await fetch(url, { method });

    if (!response.ok) {
      // Tạo lỗi với thông tin status
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data
    };

  } catch (err) {
    if (retry === 0) {
      setTimeout(async () => {
        retry++;
        await sendRequest(method, url, retry);
      }, 2000)
    }

    let error = {
      success: false,
      data: null,
      message: 'Có lỗi xảy ra khi gửi yêu cầu.',
      status: null,
    };

    // Nếu là lỗi HTTP từ fetch
    if (err.message && err.message.includes('Status:')) {
      const statusMatch = err.message.match(/Status:\s*(\d+)/);
      if (statusMatch) {
        const statusCode = Number(statusMatch[1]);
        error.status = statusCode;

        if (statusCode === STATUS_CODE_NOT_FOUND) {
          error.message = 'Không tìm thấy dữ liệu';
        } else {
          error.message = `Lỗi HTTP: ${statusCode}`;
        }
      }
    }

    return error;
  }
}

const searchUserBtn = document.querySelector("#search-user-btn");
const userProfileCard = document.querySelector("#user-profile-card");
const userIddInput = document.querySelector("#user-id-input");
const userError = document.querySelector("#user-error");
const userErrorText = document.querySelector("#user-error-text");
const autoRetryUser = document.querySelector("#auto-retry-load-user-profile-card")

const postsLoading = document.querySelector("#posts-loading");
const postsError = document.querySelector("#posts-error");
const postsErrorText = document.querySelector("#posts-error-text");
const postsContainer = document.querySelector("#posts-container");
const loadMorePostsBtn = document.querySelector("#load-more-posts-btn")

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

let numberPostShow = 0;
//1.2. Implement 3 chức năng sử dụng JSONPlaceholder API

// Chức năng 1: User Profile Card
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

function renderUser(user) {
  const userId = userIddInput.value;

  // check error khi gọi api
  if (!user.success) {
    userLoading.classList.remove("show");
    userError.classList.add("show")
    userProfileCard.classList.remove("show")
    userErrorText.textContent = `${user.message}. User Id là ${userId}`;
    return;
  }

  // Khi gọi Api thành công
  userError.classList.remove("show")
  userLoading.classList.remove("show");
  userProfileCard.classList.add("show")

  const { username, name, email, phone, website, company, address } = user.data;

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

async function sendRequestUserProfileCard(method, url) {
  const responseData = await sendRequest(method, url);
  renderUser(responseData)
}

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
  const url = `https://jsonplaceholder.typicode.com/users/${userId}`;
  sendRequestUserProfileCard(METHOD_GET, url)
})

// Chức năng 2: Posts với Comments
function renderPosts(posts, users) {
  if (!posts || !posts.length) {
    postsContainer.innerHTML = "Không tìm thấy post!"
    return;
  }

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

  loadMorePostsBtn.classList.add("show")
  return;
}

function renderComments(comments, postID, userName) {
  if (comments && comments.length) {
    const commentsContainer = document.querySelector(`.comments-container[data-post-id="${postID}"]`);

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

async function handleShowComment(postID, userName) {
  const btnComment = document.querySelector(`.show-comments-btn[data-post-id="${postID}"]`);
  const postItem = btnComment.closest(".post-item");
  const loadingSpinner = postItem.querySelector(".loading-spinner");
  const commentsError = postItem.querySelector(".error-message");
  const postsErrorText = postItem.querySelector(".error-message-text");

  loadingSpinner.classList.add("show");

  const url = `https://jsonplaceholder.typicode.com/posts/${postID}/comments`;
  const responseData = await sendRequest(METHOD_GET, url);
  loadingSpinner.classList.remove("show");

  if (!responseData.success) {
    commentsError.classList.add("show");
    postsErrorText.textContent = `${responseData.message}. Post ID là ${postID}`;
    return;
  }

  const comments = responseData.data;
  renderComments(comments, postID, userName)
  return;
}

async function sendRequestLoadPosts(method, url) {
  const urlUsers = "https://jsonplaceholder.typicode.com/users";
  const responsePostsData = await sendRequest(method, url)
  const responseUsersData = await sendRequest(method, urlUsers)
  postsError.classList.remove("show");
  postsLoading.classList.remove("show");

  if (!responsePostsData.success || !responseUsersData.success) {
    postsError.classList.add("show");
    postsErrorText.textContent = `${responsePostsData.message || responseUsersData.message}`;
    return;
  }

  const posts = responsePostsData.data;
  const users = responseUsersData.data;
  return {
    posts,
    users,
  };

}

async function loadPosts(numberPost) {
  postsLoading.classList.add("show");
  const url = `https://jsonplaceholder.typicode.com/posts?_start=${numberPost}&_limit=${LIMIT_POST_SHOW}`;
  const data = await sendRequestLoadPosts(METHOD_GET, url);

  if (data) {
    const { posts, users } = data
    renderPosts(posts, users)
  }
  return;
}

// Click button more -> Load thêm 5 post
loadMorePostsBtn.addEventListener("click", function () {
  numberPostShow += NUMBER_POST_SHOW;
  loadPosts(numberPostShow)
});

// Load posts khi vào trang
loadPosts(INIT_POST_SHOW)


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

async function sendRequestLoadTodos(method, url, userId) {
  const responseData = await sendRequest(method, url);

  todosLoading.classList.remove("show");

  if (!responseData.success) {
    todosError.classList.add("show");
    todosErrorText.textContent = responseData.message;
    return;

  } else {
    todosData = responseData.data;

    if (!todosData || !todosData.length) {
      todosError.classList.add("show");
      todosErrorText.textContent = `Không tìm thấy todos với UserId = ${userId}`;
      return;
    }

    renderTodos(todosData, userId)
  }
  return;
}

loadTodosBtn.addEventListener("click", function () {
  const userId = todoUserIdInput.value;
  const checkUserId = ValidateUserId(userId);

  // reset UI
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
  sendRequestLoadTodos(METHOD_GET, `https://jsonplaceholder.typicode.com/users/${userId}/todos`, userId)
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


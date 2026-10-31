const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const postList = document.querySelector("#postList");
const statusMessage = document.querySelector("#statusMessage");
const boardSection = document.querySelector("#boardSection");
const pageHeader = document.querySelector(".page-header");
const postDetail = document.querySelector("#postDetail");
const detailTitle = document.querySelector("#detailTitle");
const detailNickname = document.querySelector("#detailNickname");
const detailContent = document.querySelector("#detailContent");
const closeDetailButton = document.querySelector("#closeDetailButton");
const commentList = document.querySelector("#commentList");
const commentForm = document.querySelector("#commentForm");
const commentInput = document.querySelector("#commentInput");
const commentStatus = document.querySelector("#commentStatus");
const signedOutArea = document.querySelector("#signedOutArea");
const signedInArea = document.querySelector("#signedInArea");
const loggedInEmail = document.querySelector("#loggedInEmail");
const authMessage = document.querySelector("#authMessage");
const authPanel = document.querySelector("#authPanel");
const authPanelTitle = document.querySelector("#authPanelTitle");
const openSignUpButton = document.querySelector("#openSignUpButton");
const openSignInButton = document.querySelector("#openSignInButton");
const closeAuthPanelButton = document.querySelector("#closeAuthPanelButton");
const signUpForm = document.querySelector("#signUpForm");
const signInForm = document.querySelector("#signInForm");
const signUpButton = document.querySelector("#signUpButton");
const signInButton = document.querySelector("#signInButton");
const signOutButton = document.querySelector("#signOutButton");
const openWritePostButton = document.querySelector("#openWritePostButton");
const openWritePostButtonLoggedIn = document.querySelector("#openWritePostButtonLoggedIn");
const postWritePanel = document.querySelector("#postWritePanel");
const closeWritePostButton = document.querySelector("#closeWritePostButton");
const postWriteForm = document.querySelector("#postWriteForm");
const postTitleInput = document.querySelector("#postTitleInput");
const postContentInput = document.querySelector("#postContentInput");
const postWriteButton = document.querySelector("#postWriteButton");
const postWriteStatus = document.querySelector("#postWriteStatus");
const myPostsButton = document.querySelector("#myPostsButton");
const myPostsSection = document.querySelector("#myPostsSection");
const myPostsStatus = document.querySelector("#myPostsStatus");
const myPostsList = document.querySelector("#myPostsList");
const backFromMyPostsButton = document.querySelector("#backFromMyPostsButton");
const myCommentsButton = document.querySelector("#myCommentsButton");
const myCommentsSection = document.querySelector("#myCommentsSection");
const myCommentsStatus = document.querySelector("#myCommentsStatus");
const myCommentsList = document.querySelector("#myCommentsList");
const backFromMyCommentsButton = document.querySelector("#backFromMyCommentsButton");
let selectedPostId = null;
let activeUserId = null;
let myPostsRequestVersion = 0;
let myCommentsRequestVersion = 0;

function showAuthMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.classList.toggle("error", isError);
}

function getSignUpErrorMessage(error) {
  if (error.code === "weak_password") {
    return "비밀번호가 보안 조건에 맞지 않습니다. 영문·숫자·기호를 섞어 더 길게 입력해 주세요.";
  }
  if (error.code === "user_already_exists") {
    return "이미 가입된 이메일입니다. 로그인해 주세요.";
  }
  if (error.code === "email_provider_disabled") {
    return "Supabase에서 이메일 회원가입이 활성화되어 있지 않습니다.";
  }
  if (error.code === "unexpected_failure") {
    return "회원 정보 저장 중 DB 오류가 발생했습니다. Supabase Auth 로그를 확인해야 합니다.";
  }
  return `회원가입에 실패했습니다. 오류 코드: ${error.code || "확인 필요"}`;
}

function updateAuthScreen(session) {
  const previousUserId = activeUserId;
  const email = session?.user?.email;
  activeUserId = session?.user?.id || null;
  myPostsRequestVersion += 1;
  myCommentsRequestVersion += 1;
  signedOutArea.hidden = Boolean(email);
  signedInArea.hidden = !email;
  loggedInEmail.textContent = email ? `로그인한 이메일: ${email}` : "";
  if (previousUserId !== activeUserId) {
    myPostsSection.hidden = true;
    myPostsList.replaceChildren();
    myCommentsSection.hidden = true;
    myCommentsList.replaceChildren();
  }
  if (!email) {
    myPostsSection.hidden = true;
    myPostsList.replaceChildren();
    myCommentsSection.hidden = true;
    myCommentsList.replaceChildren();
    postWritePanel.hidden = true;
  }
  if (email) {
    authPanel.hidden = true;
    setBoardVisible(true);
  }
}

function setBoardVisible(isVisible) {
  pageHeader.hidden = !isVisible;
  searchForm.hidden = !isVisible;
  statusMessage.hidden = !isVisible;
  boardSection.hidden = !isVisible;
  if (!isVisible) {
    postDetail.hidden = true;
    postWritePanel.hidden = true;
    myPostsSection.hidden = true;
    myCommentsSection.hidden = true;
  }
}

function showPersonalView(type) {
  searchForm.hidden = true;
  statusMessage.hidden = true;
  boardSection.hidden = true;
  postDetail.hidden = true;
  myPostsSection.hidden = type !== "posts";
  myCommentsSection.hidden = type !== "comments";
}

function showAllPosts() {
  setBoardVisible(true);
  myPostsSection.hidden = true;
  myCommentsSection.hidden = true;
  loadPosts();
}

function showPostWriteStatus(message, isError = false) {
  postWriteStatus.textContent = message;
  postWriteStatus.classList.toggle("error", isError);
}

async function openPostWritePanel() {
  const { data, error } = await sb.auth.getSession();
  if (error) {
    showStatus("로그인 상태를 확인하지 못했습니다.", true);
    return;
  }
  if (!data.session?.user) {
    showStatus("게시글 작성은 로그인한 회원만 사용할 수 있습니다.", true);
    return;
  }

  postWritePanel.hidden = false;
  showPostWriteStatus("");
  postTitleInput.focus();
}

async function submitPost(event) {
  event.preventDefault();
  const title = postTitleInput.value.trim();
  const content = postContentInput.value.trim();

  if (!title || !content) {
    showPostWriteStatus("제목과 내용을 모두 입력해 주세요.", true);
    return;
  }

  const { data: sessionData, error: sessionError } = await sb.auth.getSession();
  if (sessionError || !sessionData.session?.user) {
    showPostWriteStatus("게시글 작성은 로그인한 회원만 사용할 수 있습니다.", true);
    return;
  }

  postWriteButton.disabled = true;
  showPostWriteStatus("게시글을 등록하는 중입니다.");
  const { error: insertError } = await sb.from("posts").insert({
    user_id: sessionData.session.user.id,
    title,
    content,
  });
  postWriteButton.disabled = false;

  if (insertError) {
    showPostWriteStatus(`게시글 등록에 실패했습니다: ${insertError.message}`, true);
    return;
  }

  postWriteForm.reset();
  postWritePanel.hidden = true;
  showStatus("게시글을 등록했습니다.");
  await loadPosts();
  if (!myPostsSection.hidden) await loadMyPosts();
}

function displayMyPosts(posts) {
  myPostsList.replaceChildren();
  if (posts.length === 0) {
    const item = document.createElement("li");
    item.textContent = "작성한 게시글이 없습니다.";
    myPostsList.append(item);
    return;
  }

  for (const post of posts) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = post.title;
    button.addEventListener("click", () => loadPostDetail(post.id));
    item.append(button);
    myPostsList.append(item);
  }
}

async function loadMyPosts() {
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();
  if (sessionError || !sessionData.session?.user) {
    myPostsSection.hidden = true;
    showStatus("내 게시글은 로그인한 회원만 조회할 수 있습니다.", true);
    return;
  }

  const userId = sessionData.session.user.id;
  const requestVersion = ++myPostsRequestVersion;
  showPersonalView("posts");
  myPostsStatus.textContent = "내 게시글을 불러오는 중입니다.";
  myPostsList.replaceChildren();

  const { data: posts, error: postsError } = await sb
    .from("posts")
    .select("id, title, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // 회원 전환 또는 로그아웃 뒤에 도착한 이전 요청의 응답은 표시하지 않습니다.
  if (requestVersion !== myPostsRequestVersion || userId !== activeUserId) return;

  if (postsError) {
    myPostsStatus.textContent = `내 게시글을 불러오지 못했습니다: ${postsError.message}`;
    return;
  }

  displayMyPosts(posts || []);
  myPostsStatus.textContent = posts.length === 0 ? "" : `내 게시글 ${posts.length}개`;
}

function displayMyComments(comments) {
  myCommentsList.replaceChildren();
  if (comments.length === 0) {
    const item = document.createElement("li");
    item.textContent = "작성한 댓글이 없습니다.";
    myCommentsList.append(item);
    return;
  }

  for (const comment of comments) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = comment.content;
    button.addEventListener("click", () => loadPostDetail(comment.post_id));
    item.append(button);
    myCommentsList.append(item);
  }
}

async function loadMyComments() {
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();
  if (sessionError || !sessionData.session?.user) {
    myCommentsSection.hidden = true;
    showStatus("내 댓글은 로그인한 회원만 조회할 수 있습니다.", true);
    return;
  }

  const userId = sessionData.session.user.id;
  const requestVersion = ++myCommentsRequestVersion;
  showPersonalView("comments");
  myCommentsStatus.textContent = "내 댓글을 불러오는 중입니다.";
  myCommentsList.replaceChildren();

  const { data: comments, error: commentsError } = await sb
    .from("comments")
    .select("id, post_id, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // 회원 전환 또는 로그아웃 뒤에 도착한 이전 요청의 응답은 표시하지 않습니다.
  if (requestVersion !== myCommentsRequestVersion || userId !== activeUserId) return;

  if (commentsError) {
    myCommentsStatus.textContent = `내 댓글을 불러오지 못했습니다: ${commentsError.message}`;
    return;
  }

  displayMyComments(comments || []);
  myCommentsStatus.textContent = comments.length === 0 ? "" : `내 댓글 ${comments.length}개`;
}

function openAuthPanel(type) {
  const isSignUp = type === "signup";
  authPanel.hidden = false;
  signUpForm.hidden = !isSignUp;
  signInForm.hidden = isSignUp;
  openSignInButton.hidden = isSignUp;
  authPanelTitle.textContent = isSignUp ? "회원가입" : "로그인";
  showAuthMessage("");
  setBoardVisible(false);
  (isSignUp ? document.querySelector("#signUpEmail") : document.querySelector("#signInEmail")).focus();
}

async function restoreAuthSession() {
  const { data, error } = await sb.auth.getSession();
  if (error) {
    showAuthMessage("로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.", true);
    updateAuthScreen(null);
    return;
  }
  updateAuthScreen(data.session);
}

async function handleSignUp(event) {
  event.preventDefault();
  const email = document.querySelector("#signUpEmail").value.trim();
  const password = document.querySelector("#signUpPassword").value;
  signUpButton.disabled = true;
  showAuthMessage("회원가입을 처리하는 중입니다.");

  const { data, error } = await sb.auth.signUp({ email, password });
  signUpButton.disabled = false;

  if (error) {
    console.error("Supabase 회원가입 오류:", error);
    showAuthMessage(getSignUpErrorMessage(error), true);
    return;
  }

  signUpForm.reset();
  if (!data.session) {
    showAuthMessage("회원가입되었습니다. 이메일 확인 후 로그인해 주세요.");
    return;
  }
  showAuthMessage("회원가입과 로그인이 완료되었습니다.");
}

async function handleSignIn(event) {
  event.preventDefault();
  const email = document.querySelector("#signInEmail").value.trim();
  const password = document.querySelector("#signInPassword").value;
  signInButton.disabled = true;
  showAuthMessage("로그인하는 중입니다.");

  const { error } = await sb.auth.signInWithPassword({ email, password });
  signInButton.disabled = false;

  if (error) {
    showAuthMessage("로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.", true);
    return;
  }

  signInForm.reset();
  showAuthMessage("로그인되었습니다.");
}

async function handleSignOut() {
  signOutButton.disabled = true;
  showAuthMessage("로그아웃하는 중입니다.");
  const { error } = await sb.auth.signOut();
  signOutButton.disabled = false;

  if (error) {
    showAuthMessage("로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.", true);
    return;
  }
  showAuthMessage("로그아웃되었습니다.");
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function showEmptyRow(message) {
  postList.replaceChildren();
  const row = document.createElement("tr");
  row.className = "empty-row";
  const cell = document.createElement("td");
  cell.colSpan = 3;
  cell.textContent = message;
  row.append(cell);
  postList.append(row);
}

function displayPosts(posts, nicknames) {
  postList.replaceChildren();

  for (const post of posts) {
    const row = document.createElement("tr");
    const idCell = document.createElement("td");
    const titleCell = document.createElement("td");
    const nicknameCell = document.createElement("td");
    const titleButton = document.createElement("button");

    idCell.textContent = String(post.id);
    titleButton.type = "button";
    titleButton.className = "post-title-button";
    titleButton.textContent = post.title;
    titleButton.addEventListener("click", () => loadPostDetail(post.id));
    titleCell.append(titleButton);
    nicknameCell.textContent = nicknames.get(post.user_id) || "알 수 없음";

    row.append(idCell, titleCell, nicknameCell);
    postList.append(row);
  }
}

async function loadPostDetail(postId) {
  showStatus("게시글 내용을 불러오는 중입니다.");

  const { data: post, error: postError } = await sb
    .from("posts")
    .select("id, title, content, user_id")
    .eq("id", postId)
    .single();

  if (postError) {
    showStatus(`오류: ${postError.message}`, true);
    return;
  }

  const { data: profile, error: profileError } = await sb
    .from("author_profiles")
    .select("nickname")
    .eq("id", post.user_id)
    .single();

  if (profileError) {
    showStatus(`오류: ${profileError.message}`, true);
    return;
  }

  detailTitle.textContent = post.title;
  detailNickname.textContent = `작성자: ${profile.nickname}`;
  detailContent.textContent = post.content;
  pageHeader.hidden = true;
  searchForm.hidden = true;
  statusMessage.hidden = true;
  boardSection.hidden = true;
  myPostsSection.hidden = true;
  myCommentsSection.hidden = true;
  postWritePanel.hidden = true;
  postDetail.hidden = false;
  selectedPostId = post.id;
  showStatus("게시글 내용을 표시합니다.");
  await loadComments(post.id);
  postDetail.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showCommentStatus(message, isError = false) {
  commentStatus.textContent = message;
  commentStatus.classList.toggle("error", isError);
}

function showComments(comments, nicknames) {
  commentList.replaceChildren();

  if (!comments || comments.length === 0) {
    const item = document.createElement("li");
    item.className = "comment-item";
    item.textContent = "첫 댓글을 남겨 보세요.";
    commentList.append(item);
    return;
  }

  for (const comment of comments) {
    const item = document.createElement("li");
    const meta = document.createElement("p");
    const content = document.createElement("p");
    item.className = "comment-item";
    meta.className = "comment-meta";
    content.className = "comment-content";
    meta.textContent = nicknames.get(comment.user_id) || "알 수 없음";
    content.textContent = comment.content;
    item.append(meta, content);
    commentList.append(item);
  }
}

async function loadComments(postId) {
  showCommentStatus("댓글을 불러오는 중입니다.");
  commentList.replaceChildren();

  const { data: comments, error: commentsError } = await sb
    .from("comments")
    .select("id, user_id, content, created_at")
    .eq("post_id", postId)
    .order("id", { ascending: true });

  if (commentsError) {
    showCommentStatus(`오류: ${commentsError.message}`, true);
    return;
  }

  const userIds = [...new Set((comments || []).map((comment) => comment.user_id))];
  let profiles = [];

  if (userIds.length > 0) {
    const { data, error: profilesError } = await sb
      .from("author_profiles")
      .select("id, nickname")
      .in("id", userIds);

    if (profilesError) {
      showCommentStatus(`오류: ${profilesError.message}`, true);
      return;
    }
    profiles = data || [];
  }

  const nicknames = new Map(profiles.map((profile) => [profile.id, profile.nickname]));
  showComments(comments, nicknames);
  showCommentStatus(comments.length === 0 ? "" : `댓글 ${comments.length}개`);
}

async function submitComment(event) {
  event.preventDefault();
  const content = commentInput.value.trim();

  if (!selectedPostId || !content) {
    showCommentStatus("댓글 내용을 입력해 주세요.", true);
    return;
  }

  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) {
    showCommentStatus(`오류: ${userError.message}`, true);
    return;
  }

  if (!userData.user) {
    showCommentStatus("댓글은 로그인한 회원만 등록할 수 있습니다.", true);
    return;
  }

  const { error: insertError } = await sb.from("comments").insert({
    post_id: selectedPostId,
    user_id: userData.user.id,
    content,
  });

  if (insertError) {
    showCommentStatus(`오류: ${insertError.message}`, true);
    return;
  }

  commentInput.value = "";
  showCommentStatus("댓글을 등록했습니다.");
  await loadComments(selectedPostId);
  if (!myCommentsSection.hidden) await loadMyComments();
}

async function loadPosts() {
  const keyword = searchInput.value.trim();
  showStatus("게시글을 불러오는 중입니다.");
  postList.replaceChildren();

  let postsQuery = sb
    .from("posts")
    .select("id, title, user_id")
    .order("id", { ascending: false });

  // 빈 검색어에서는 전체 목록을, 검색어가 있으면 제목 포함 검색을 합니다.
  if (keyword) {
    postsQuery = postsQuery.ilike("title", `%${keyword}%`);
  }

  const { data: posts, error: postsError } = await postsQuery;
  if (postsError) {
    showEmptyRow("게시글을 불러오지 못했습니다.");
    showStatus(`오류: ${postsError.message}`, true);
    return;
  }

  if (!posts || posts.length === 0) {
    showEmptyRow("검색 결과가 없습니다.");
    showStatus(keyword ? `“${keyword}” 검색 결과가 없습니다.` : "등록된 게시글이 없습니다.");
    return;
  }

  const userIds = [...new Set(posts.map((post) => post.user_id))];
  const { data: profiles, error: profilesError } = await sb
    .from("author_profiles")
    .select("id, nickname")
    .in("id", userIds);

  if (profilesError) {
    showEmptyRow("작성자 정보를 불러오지 못했습니다.");
    showStatus(`오류: ${profilesError.message}`, true);
    return;
  }

  const nicknames = new Map((profiles || []).map((profile) => [profile.id, profile.nickname]));
  displayPosts(posts, nicknames);
  showStatus(`게시글 ${posts.length}개를 표시합니다.`);
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadPosts();
});

closeDetailButton.addEventListener("click", () => {
  postDetail.hidden = true;
  selectedPostId = null;
  showAllPosts();
});

commentForm.addEventListener("submit", submitComment);
signUpForm.addEventListener("submit", handleSignUp);
signInForm.addEventListener("submit", handleSignIn);
signOutButton.addEventListener("click", handleSignOut);
openWritePostButton.addEventListener("click", openPostWritePanel);
openWritePostButtonLoggedIn.addEventListener("click", openPostWritePanel);
closeWritePostButton.addEventListener("click", () => {
  postWritePanel.hidden = true;
  showPostWriteStatus("");
});
postWriteForm.addEventListener("submit", submitPost);
myPostsButton.addEventListener("click", loadMyPosts);
myCommentsButton.addEventListener("click", loadMyComments);
backFromMyPostsButton.addEventListener("click", showAllPosts);
backFromMyCommentsButton.addEventListener("click", showAllPosts);
openSignUpButton.addEventListener("click", () => openAuthPanel("signup"));
openSignInButton.addEventListener("click", () => openAuthPanel("signin"));
closeAuthPanelButton.addEventListener("click", () => {
  authPanel.hidden = true;
  openSignInButton.hidden = false;
  showAuthMessage("");
  setBoardVisible(true);
});

// 콜백에서는 화면만 갱신하고, 추가 Supabase 비동기 호출을 하지 않습니다.
sb.auth.onAuthStateChange((_event, session) => {
  updateAuthScreen(session);
});

restoreAuthSession();
loadPosts();


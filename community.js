(() => {
  const $ = (selector) => document.querySelector(selector);
  const avatarFallback = "avatars/avatar-01.jpg";
  const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
  const maxImageBytes = 20 * 1024 * 1024;
  const maxVideoBytes = 100 * 1024 * 1024;
  const activeKey = "khkozak.active-local-player";
  const dbName = "khkozak-community-local";
  let db;
  let activeUid = readActiveUid();
  let requestedUid = new URLSearchParams(location.search).get("user");
  let selectedProfile = null;
  let previewUrl = null;
  let profileAvatarUrl = null;
  const feedUrls = new Set();
  const memberUrls = new Set();

  function say(selector, message, kind = "") {
    const element = $(selector);
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = kind;
  }

  function label(value, fallback = "Гравець") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function readActiveUid() {
    try { return localStorage.getItem(activeKey) || ""; }
    catch { return ""; }
  }

  function rememberActiveUid(uid) {
    activeUid = uid || "";
    try {
      if (activeUid) localStorage.setItem(activeKey, activeUid);
      else localStorage.removeItem(activeKey);
    } catch { /* The session still works until this page is closed. */ }
  }

  function setRequestedProfile(uid) {
    requestedUid = uid || "";
    try { history.replaceState({}, "", requestedUid ? `community.html?user=${encodeURIComponent(requestedUid)}` : "community.html"); }
    catch { /* Some file:// browser previews do not allow History API URL changes. */ }
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        const store = request.result;
        if (!store.objectStoreNames.contains("profiles")) store.createObjectStore("profiles", { keyPath: "id" });
        if (!store.objectStoreNames.contains("posts")) {
          const posts = store.createObjectStore("posts", { keyPath: "id" });
          posts.createIndex("authorId", "authorId", { unique: false });
          posts.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Не вдалося відкрити пам’ять браузера."));
      request.onblocked = () => reject(new Error("Закрий інші вкладки цього сайту й онови сторінку."));
    });
  }

  function readOne(storeName, key) {
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readonly").objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  function readAll(storeName) {
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  function writeOne(storeName, record) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const request = transaction.objectStore(storeName).put(record);
      let result;
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error || new Error("Помилка збереження."));
      transaction.onabort = () => reject(transaction.error || new Error("Збереження перервано."));
    });
  }

  function deleteOne(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const request = transaction.objectStore(storeName).delete(key);
      request.onsuccess = () => {};
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Помилка видалення."));
    });
  }

  function objectUrl(blob, collection = null) {
    if (!blob) return avatarFallback;
    const url = URL.createObjectURL(blob);
    collection?.add(url);
    return url;
  }

  function revokeCollection(collection) {
    collection.forEach((url) => URL.revokeObjectURL(url));
    collection.clear();
  }

  function disableLocalMode(message) {
    const callout = $("#setup-callout");
    callout.hidden = false;
    callout.textContent = message;
    ["#signup-button", "#login-button", "#publish-button"].forEach((selector) => {
      const button = $(selector);
      if (button) button.disabled = true;
    });
    $("#member-grid").innerHTML = '<div class="empty-state">Цей браузер не дозволив зберегти локальні профілі.</div>';
  }

  async function start() {
    if (!("indexedDB" in window)) return disableLocalMode("Цей браузер не підтримує локальне сховище для профілів і медіа.");
    try {
      db = await openDatabase();
      $("#signup-button").addEventListener("click", createProfile);
      $("#auth-form").addEventListener("submit", chooseProfile);
      $("#signout-button").addEventListener("click", switchProfile);
      $("#profile-form").addEventListener("submit", saveProfile);
      $("#upload-form").addEventListener("submit", publishMedia);
      $("#media-type").addEventListener("change", updateFileAccept);
      $("#media-file").addEventListener("change", previewSelectedFile);
      updateFileAccept();
      await updateProfileOptions();
      await updateSession();
      await showRequestedProfile();
      await loadMembers();
    } catch (error) {
      console.error(error);
      disableLocalMode(friendlyError(error));
    }
  }

  async function updateProfileOptions() {
    const select = $("#local-profile-select");
    const profiles = (await readAll("profiles")).sort((a, b) => b.createdAt - a.createdAt);
    select.replaceChildren();
    if (!profiles.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Ще немає профілів";
      select.append(option);
      $("#login-button").disabled = true;
      return;
    }
    profiles.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = `${label(profile.displayName)}${profile.id === activeUid ? " · активний" : ""}`;
      select.append(option);
    });
    $("#login-button").disabled = false;
    if (activeUid && profiles.some((profile) => profile.id === activeUid)) select.value = activeUid;
  }

  async function createProfile() {
    const displayName = $("#signup-name").value.trim();
    if (displayName.length < 2 || displayName.length > 40) return say("#auth-status", "Ігрове ім’я має містити 2–40 символів.", "error");
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const profile = { id, displayName, about: "", avatarBlob: null, avatarPostId: null, createdAt: Date.now() };
    try {
      await writeOne("profiles", profile);
      rememberActiveUid(id);
      setRequestedProfile(id);
      $("#signup-name").value = "";
      await updateProfileOptions();
      await updateSession();
      await showRequestedProfile();
      await loadMembers();
      say("#auth-status", "Локальний профіль створено на цьому пристрої.", "success");
    } catch (error) { say("#auth-status", friendlyError(error), "error"); }
  }

  async function chooseProfile(event) {
    event.preventDefault();
    const id = $("#local-profile-select").value;
    if (!id) return say("#auth-status", "Спочатку створи профіль на цьому пристрої.", "error");
    const profile = await readOne("profiles", id);
    if (!profile) return say("#auth-status", "Цей локальний профіль не знайдено.", "error");
    rememberActiveUid(id);
    setRequestedProfile(id);
    await updateProfileOptions();
    await updateSession();
    await showRequestedProfile();
    await loadMembers();
    say("#auth-status", `Вибрано профіль ${label(profile.displayName)}.`, "success");
  }

  async function switchProfile() {
    rememberActiveUid("");
    await updateProfileOptions();
    await updateSession();
    await loadMembers();
    if (requestedUid) await showRequestedProfile();
    else await loadPosts();
    say("#auth-status", "Вибери інший локальний профіль або створи новий.");
  }

  async function updateSession() {
    const profile = activeUid ? await readOne("profiles", activeUid) : null;
    if (!profile && activeUid) rememberActiveUid("");
    $("#auth-form").hidden = Boolean(profile);
    $("#session-row").hidden = !profile;
    $("#session-name").textContent = profile ? label(profile.displayName) : "";
    $("#session-email").textContent = profile ? "Лише цей пристрій і браузер" : "";
    $("#my-profile-link").href = profile ? `community.html?user=${encodeURIComponent(profile.id)}` : "community.html";
    const canPostHere = Boolean(profile && (!requestedUid || requestedUid === profile.id));
    $("#upload-panel").hidden = !canPostHere;
    if (!profile) statusHint();
  }

  function statusHint() {
    if (!$("#auth-status").textContent) say("#auth-status", "Створи або вибери локальний профіль, щоб зберігати публікації на цьому пристрої.");
  }

  async function showRequestedProfile() {
    if (!requestedUid) {
      selectedProfile = null;
      $("#profile-panel").hidden = true;
      $("#feed-title").textContent = "Стрічка цього браузера";
      $("#feed-description").textContent = "Тут збережені локальні кліпи, фото й аватарки.";
      await updateSession();
      await loadPosts();
      return;
    }
    const profile = await readOne("profiles", requestedUid);
    const panel = $("#profile-panel");
    panel.hidden = false;
    if (!profile) {
      selectedProfile = null;
      $("#profile-name").textContent = "Профіль не знайдено";
      $("#profile-id").textContent = "";
      $("#profile-bio").textContent = "Цей локальний профіль недоступний у поточному браузері.";
      $("#profile-form").hidden = true;
      $("#feed-grid").replaceChildren();
      empty("#feed-grid", "Профіль зберігається в іншому браузері або на іншому пристрої.");
      await updateSession();
      return;
    }
    selectedProfile = profile;
    const isOwner = activeUid === profile.id;
    $("#profile-name").textContent = label(profile.displayName);
    $("#profile-id").textContent = `LOCAL PLAYER · ${profile.id.slice(0, 12).toUpperCase()}`;
    $("#profile-bio").textContent = label(profile.about, "Гравець PUBG Mobile · локальний профіль");
    if (profileAvatarUrl) URL.revokeObjectURL(profileAvatarUrl);
    profileAvatarUrl = profile.avatarBlob ? objectUrl(profile.avatarBlob) : null;
    $("#profile-avatar").src = profileAvatarUrl || avatarFallback;
    $("#profile-form").hidden = !isOwner;
    if (isOwner) {
      $("#profile-display-name").value = label(profile.displayName, "");
      $("#profile-about").value = typeof profile.about === "string" ? profile.about : "";
    }
    $("#feed-title").textContent = `Публікації · ${label(profile.displayName)}`;
    $("#feed-description").textContent = "Локальні відео, фото й аватарки цього профілю.";
    await updateSession();
    await loadPosts();
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!selectedProfile || selectedProfile.id !== activeUid) return;
    const displayName = $("#profile-display-name").value.trim();
    const about = $("#profile-about").value.trim();
    if (displayName.length < 2 || displayName.length > 40) return say("#profile-status", "Ім’я має містити 2–40 символів.", "error");
    const next = { ...selectedProfile, displayName, about };
    try {
      await writeOne("profiles", next);
      selectedProfile = next;
      $("#profile-name").textContent = displayName;
      $("#profile-bio").textContent = about || "Гравець PUBG Mobile · локальний профіль";
      $("#session-name").textContent = displayName;
      await updateProfileOptions();
      await loadMembers();
      say("#profile-status", "Профіль збережено у цьому браузері.", "success");
    } catch (error) { say("#profile-status", friendlyError(error), "error"); }
  }

  function updateFileAccept() {
    const kind = $("#media-type").value;
    $("#media-file").accept = kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/gif";
    $("#media-file").value = "";
    clearPreview();
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    $("#image-preview").removeAttribute("src");
    $("#image-preview").dataset.visible = "false";
    const video = $("#video-preview");
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.dataset.visible = "false";
  }

  function previewSelectedFile() {
    clearPreview();
    const file = $("#media-file").files?.[0];
    if (!file) return;
    previewUrl = URL.createObjectURL(file);
    if (file.type.startsWith("image/")) {
      $("#image-preview").src = previewUrl;
      $("#image-preview").dataset.visible = "true";
    } else if (file.type.startsWith("video/")) {
      $("#video-preview").src = previewUrl;
      $("#video-preview").dataset.visible = "true";
    }
  }

  async function publishMedia(event) {
    event.preventDefault();
    if (!activeUid) return say("#upload-status", "Спочатку створи або вибери локальний профіль.", "error");
    const profile = await readOne("profiles", activeUid);
    if (!profile) return say("#upload-status", "Профіль не знайдено. Вибери його ще раз.", "error");
    const file = $("#media-file").files?.[0];
    const mediaType = $("#media-type").value;
    const isVideo = mediaType === "video";
    if (!file) return say("#upload-status", "Обери файл для публікації.", "error");
    if (!(isVideo ? videoTypes : imageTypes).includes(file.type)) return say("#upload-status", "Цей формат не підтримується. Обери MP4, WebM, MOV, JPG, PNG, WebP або GIF.", "error");
    if (file.size > (isVideo ? maxVideoBytes : maxImageBytes)) return say("#upload-status", `Файл завеликий. Максимум: ${isVideo ? "100 МБ" : "20 МБ"}.`, "error");
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `post-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const post = {
      id,
      authorId: profile.id,
      authorName: label(profile.displayName),
      mediaType,
      caption: $("#media-caption").value.trim(),
      blob: file.slice(0, file.size, file.type),
      fileType: file.type,
      createdAt: Date.now(),
    };
    $("#publish-button").disabled = true;
    say("#upload-status", "Зберігаю файл у пам’ять браузера…");
    try {
      await writeOne("posts", post);
      if (mediaType === "avatar") {
        const updatedProfile = { ...profile, avatarBlob: post.blob, avatarPostId: id };
        try { await writeOne("profiles", updatedProfile); }
        catch (error) { await deleteOne("posts", id); throw error; }
        if (requestedUid === profile.id) selectedProfile = updatedProfile;
      }
      $("#upload-form").reset();
      updateFileAccept();
      say("#upload-status", "Збережено у локальній стрічці цього браузера.", "success");
      await loadPosts();
      if (mediaType === "avatar" && requestedUid === profile.id) await showRequestedProfile();
      if (mediaType === "avatar") await loadMembers();
    } catch (error) { say("#upload-status", friendlyError(error), "error"); }
    finally { $("#publish-button").disabled = false; }
  }

  async function loadPosts() {
    revokeCollection(feedUrls);
    const container = $("#feed-grid");
    container.replaceChildren();
    let posts = await readAll("posts");
    if (requestedUid) posts = posts.filter((post) => post.authorId === requestedUid);
    posts.sort((a, b) => b.createdAt - a.createdAt);
    posts = posts.slice(0, 30);
    if (!posts.length) return empty("#feed-grid", "Публікацій поки немає. Додай перше відео або фото.");
    const profiles = new Map((await readAll("profiles")).map((profile) => [profile.id, profile]));
    posts.forEach((post) => container.append(makePostCard(post, profiles.get(post.authorId))));
  }

  async function loadMembers() {
    revokeCollection(memberUrls);
    const container = $("#member-grid");
    container.replaceChildren();
    const profiles = (await readAll("profiles")).sort((a, b) => b.createdAt - a.createdAt).slice(0, 12);
    if (!profiles.length) return empty("#member-grid", "Профілі ще не створені в цьому браузері.");
    profiles.forEach((profile) => container.append(makeMemberCard(profile)));
  }

  function makeMemberCard(profile) {
    const link = document.createElement("a");
    link.className = "member-card";
    link.href = `community.html?user=${encodeURIComponent(profile.id)}`;
    const image = document.createElement("img");
    image.className = "member-avatar";
    image.src = profile.avatarBlob ? objectUrl(profile.avatarBlob, memberUrls) : avatarFallback;
    image.alt = `Аватар ${label(profile.displayName)}`;
    const copy = document.createElement("span");
    copy.style.minWidth = "0";
    const name = document.createElement("span");
    name.className = "member-name";
    name.textContent = label(profile.displayName);
    const tag = document.createElement("span");
    tag.className = "member-tag";
    tag.textContent = profile.id === activeUid ? "АКТИВНИЙ · ЛОКАЛЬНИЙ" : "ЛОКАЛЬНИЙ ПРОФІЛЬ";
    copy.append(name, tag);
    link.append(image, copy);
    return link;
  }

  function makePostCard(post, profile) {
    const article = document.createElement("article");
    article.className = "post-card";
    const media = document.createElement(post.mediaType === "video" ? "video" : "img");
    media.className = "post-media";
    media.src = objectUrl(post.blob, feedUrls);
    if (post.mediaType === "video") {
      media.controls = true;
      media.playsInline = true;
      media.preload = "metadata";
    } else {
      media.alt = post.mediaType === "avatar" ? "Аватарка гравця" : "Фото з PUBG Mobile";
      media.loading = "lazy";
    }
    article.append(media);
    const body = document.createElement("div");
    body.className = "post-body";
    const author = document.createElement("a");
    author.className = "post-author";
    author.href = `community.html?user=${encodeURIComponent(post.authorId)}`;
    author.textContent = label(profile?.displayName || post.authorName);
    const caption = document.createElement("p");
    caption.className = "post-caption";
    caption.textContent = label(post.caption, post.mediaType === "avatar" ? "Нова аватарка" : "Без підпису");
    const meta = document.createElement("div");
    meta.className = "post-meta";
    const category = document.createElement("span");
    category.textContent = ({ video: "ВІДЕО", photo: "ФОТО", avatar: "АВАТАРКА" })[post.mediaType] || "PUBG MOBILE";
    const date = document.createElement("span");
    date.textContent = new Date(post.createdAt).toLocaleDateString("uk-UA");
    meta.append(category, date);
    if (activeUid === post.authorId) {
      const remove = document.createElement("button");
      remove.className = "text-action";
      remove.type = "button";
      remove.textContent = "Видалити";
      remove.addEventListener("click", () => { void removePost(post); });
      meta.append(remove);
    }
    body.append(author, caption, meta);
    article.append(body);
    return article;
  }

  async function removePost(post) {
    if (activeUid !== post.authorId || !confirm("Видалити цю локальну публікацію?")) return;
    try {
      await deleteOne("posts", post.id);
      const profile = await readOne("profiles", post.authorId);
      if (post.mediaType === "avatar" && profile?.avatarPostId === post.id) {
        const updated = { ...profile, avatarBlob: null, avatarPostId: null };
        await writeOne("profiles", updated);
        if (requestedUid === post.authorId) selectedProfile = updated;
        if (profileAvatarUrl) URL.revokeObjectURL(profileAvatarUrl);
        profileAvatarUrl = null;
        if (requestedUid === post.authorId) $("#profile-avatar").src = avatarFallback;
      }
      await loadPosts();
      await loadMembers();
      say("#global-notice", "Локальну публікацію видалено.", "success");
      $("#global-notice").hidden = false;
    } catch (error) {
      say("#global-notice", friendlyError(error), "error");
      $("#global-notice").hidden = false;
    }
  }

  function empty(selector, message) {
    const element = document.createElement("div");
    element.className = "empty-state";
    element.textContent = message;
    $(selector).append(element);
  }

  function friendlyError(error) {
    if (error?.name === "QuotaExceededError") return "У браузері закінчилося місце. Видали старі великі відео або звільни пам’ять пристрою.";
    if (error?.name === "SecurityError") return "Браузер заборонив локальне сховище. Відкрий сайт у звичайній вкладці браузера.";
    return error?.message || "Не вдалося зберегти дані у цьому браузері.";
  }

  start();
})();

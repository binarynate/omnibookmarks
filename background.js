// Polyfill globalThis.browser instead of using globalThis.chrome because FireFox's
// globalThis.chrome APIs don't yet support the promise-based APIs from Manifest v3.
// Also, use globalThis because window isn't defined in service workers.
if (!globalThis.browser) {
  globalThis.browser = chrome;
}

browser.omnibox.onInputEntered.addListener(handleOmniboxInput);

function handleOmniboxInput(rawText) {

  const text = rawText.trim();
  if (!text.length) {
    return;
  }
  const prefix = text[0];
  switch (prefix) {
    case '+':
      saveBookmark(text);
      break;
    case '-':
      removeBookmark(text);
      break;
    default:
      openBookmark(text);
  }
}

async function saveBookmark(text) {

  const name = text.substr(1);
  if (!name) {
    notifyNameMissing('add', '+');
    return;
  }
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const { url } = tabs[0];
  const newBookmarkCreated = await Bookmarks.save(name, url);
  const verb = newBookmarkCreated ? 'added' : 'updated';
  notify(`Bookmark ${verb}`, `Successfully ${verb} the bookmark "${name}".`);
}

async function removeBookmark(text) {

  const name = text.substr(1);
  if (!name) {
    notifyNameMissing('remove', '-');
    return;
  }
  const matchingBookmarkRemoved = await Bookmarks.remove(name);
  if (matchingBookmarkRemoved) {
    notify('Bookmark removed', `Successfully removed the bookmark "${name}".`);
    return;
  }
  notifyNotFound(name);
}

async function openBookmark(name) {

  const url = await Bookmarks.get(name);
  if (url) {
    browser.tabs.create({ url });
    return;
  }
  notifyNotFound(name);
}

function notify(title, message) {

  browser.notifications.create('', {
    type: 'basic',
    title,
    message,
    iconUrl: 'img/icon_48.png'
  });
}

function notifyNameMissing(verb, prefix) {

  notify('You forgot to include a bookmark name!', `To ${verb} a bookmark, include a name after the "${prefix}", like "${prefix}fav".`);
}

function notifyNotFound(name) {

  notify('Bookmark not found', `You don't have any bookmarks with the name "${name}" yet.`)
}

class Bookmarks {

  static async remove(title) {

    const bookmark = await this._getBookmark(title);
    if (bookmark) {
      await browser.bookmarks.remove(bookmark.id);
      return true;
    }
    return false;
  }

  /** @returns {string|null} The URL for the matching bookmark, or null if none matches. */
  static async get(title) {

    const bookmark = await this._getBookmark(title);
    return bookmark && bookmark.url;
  }

  /** @returns {boolean} true if a new bookmark was created or false if an existing one was updated. */
  static async save(title, url) {

    const existingBookmark = await this._getBookmark(title);
    if (existingBookmark) {
      await browser.bookmarks.update(existingBookmark.id, { url });
      return false;
    }
    const parentId = await this._getFolderId();
    await browser.bookmarks.create({ parentId, title, url });
    return true;
  }

  static _cachedFolderId = 0;
  static FOLDER_NAME = 'Omnibookmarks';

  static async _getBookmark(title) {

    const bookmarks = await this._getChildren();
    const bookmarkOrNull = bookmarks.find(b => b.title === title) || null;
    return bookmarkOrNull;
  }

  static async _getChildren() {

    const id = await this._getFolderId();
    const children = await browser.bookmarks.getChildren(id);
    return children;
  }

  static async _getFolderId() {

    if (!this._cachedFolderId) {
      // Search to allow the Omnibookmarks folder to be manually moved somewhere else.
      const results = await browser.bookmarks.search({ title: this.FOLDER_NAME })
      const existingFolder = results[0];
      if (existingFolder) {
        this._cachedFolderId = existingFolder.id;
      } else {
        const newFolder = await browser.bookmarks.create({ title: this.FOLDER_NAME });
        this._cachedFolderId = newFolder.id;
      }
    }
    return this._cachedFolderId;
  }
}

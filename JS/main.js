import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const bookshelf = document.getElementById('bookshelf');
const descriptionElement = document.getElementById('bookDescriptionDiv');
const descriptionTitle = document.getElementById('bookTitle');
const blockshelf = document.getElementById('blockshelf');
const bookreader = document.getElementById('bookreader');
const bookreader_title_container = document.getElementById('title-container');
const blockSort = document.getElementById('block-sort');
const shelfSort = document.getElementById('shelf-sort');

let book_content;
let blockedBooks = false;
let current_page = 0;
let saved_book_list;
let results = [];
let search = false;

const firebaseConfig = {
    apiKey: "AIzaSyAdsgCuoNen7d6YGKCFGa6jWCctp_-OL_0",
    authDomain: "emc-library.firebaseapp.com",
    databaseURL: "https://emc-library-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "emc-library",
    storageBucket: "emc-library.appspot.com",
    messagingSenderId: "440928045886",
    appId: "1:440928045886:web:81e48f7b344aad56f5fa6f"
  };

const app = initializeApp(firebaseConfig)
const db = getDatabase(window.firebaseApp);

let reference = ref(db, 'fronts/')

let loaded_books;

const loadBooks = async () => {
	loaded_books = (await get(reference)).val() || "No data available";
};

const backgrounds = [
    'url(../ASSETS/Books-1.png)',
    'url(../ASSETS/Books-2.png)',
    'url(../ASSETS/Books-3.png)',
    'url(../ASSETS/Books-4.png)',
    'url(../ASSETS/Books-5.png)',
    'url(../ASSETS/Books-6.png)',
    'url(../ASSETS/Books-7.png)',
];


loadBooks().then(() => {
    function renderBooksShelf(book_list) {
        if (!bookshelf) return;
    
        for (let i = bookshelf.children.length - 1; i >= 0; i--) {
            const child = bookshelf.children[i];
            if (child.id !== 'bookDescriptionDiv') {
                bookshelf.removeChild(child);
            }
        }
        if (book_list) {
            for (let i = 0; i < Object.keys(book_list).length; i++) {
                const book = document.createElement('div');
                book.onclick = function() {
                    openBookReader(i);
                };
                book.className = 'book';
                const bookID = `book${i}`;
                book.id = bookID;
                book.onmouseover = function() {show_descr(i)};
                book.onmouseleave = function() {hide_descr()};
                const main_key = Object.keys(book_list)[i];
                const colordata = book_list[main_key]['color'];
                book.style.backgroundImage = backgrounds[colordata];
                bookshelf.appendChild(book);
            }
        }
    }
    renderBooksShelf(loaded_books);
    
    const isMobile = window.innerWidth <= 600;
    const layoutExists = localStorage.getItem('layout') !== null;
    const isLayoutTrue = localStorage.getItem('layout') === 'true';
    
    if (isMobile || (layoutExists && isLayoutTrue)) {
        document.getElementById('sort-button').value = 'all';
        blockSort.style.backgroundImage = 'url(../ASSETS/sort-block-select-button.png)';
        shelfSort.style.backgroundImage = 'url(../ASSETS/sort-shelf-button.png)';
        gotoBlock(loaded_books);
        blockedBooks = true;
        bookshelf.style.display = "none";
        blockshelf.style.display = "flex";
    }


    document.addEventListener("mousedown", function(event) {
        if (bookreader.style.display == 'block' && !bookreader.contains(event.target)) {
            closeBookReader()
        }
    });

    const loadBookContent = async (bookKey) => {
        const reference = ref(db, `library/${bookKey}`);
        const snapshot = await get(reference);
        return snapshot.val();
    };

    function show_descr(bookKey) {
        const bookDescription = document.getElementById('bookDescription');
        const bookAuthor = document.getElementById('bookAuthor');

        let bookData;
        if (getFilter() == 'saved' && saved_book_list) {
            bookData = saved_book_list[bookKey];
        } else if (search ) {
            bookData = results[bookKey]
        } else {
            const main_key = Object.keys(loaded_books)[bookKey];
            bookData = loaded_books[main_key];
        }

        const bookID = `book${bookKey}`
        const offsets = document.getElementById(bookID).getBoundingClientRect();
        const bookTop = offsets.top;
        const bookLeft = offsets.left;
        descriptionElement.style.top =  `${bookTop}px`;
        if (bookLeft < window.innerWidth / 2) {
            descriptionElement.style.left = `${bookLeft + 20}px`;
        } else {
            descriptionElement.style.left = `${bookLeft - 315}px`;
        }
        if (bookTop > window.innerHeight / 2) {
            descriptionElement.style.top = `${bookTop - 190}px`;
        }
        descriptionTitle.innerText = bookData['title'];
        bookDescription.innerText = bookData['descr'];
        bookAuthor.innerText = 'Written by ' + bookData['author'] ;
        descriptionElement.style.display = 'block';
    }

    function hide_descr() {
        descriptionElement.style.display = 'none';
    }

    window.blockLayout = function() {
        localStorage.setItem('layout', true);
        document.getElementById('sort-button').value = 'all';
        blockSort.style.backgroundImage = 'url(../ASSETS/sort-block-select-button.png)';
        shelfSort.style.backgroundImage = 'url(../ASSETS/sort-shelf-button.png)';
        gotoBlock(loaded_books)
        blockedBooks = true;
        bookshelf.style.display = "none"
        blockshelf.style.display = "flex"
    }

    window.shelfLayout = function() {
        localStorage.setItem('layout', false);        
        document.getElementById('sort-button').value = 'all';
        blockSort.style.backgroundImage = 'url(../ASSETS/sort-block-button.png)';
        shelfSort.style.backgroundImage = 'url(../ASSETS/sort-shelf-select-button.png)';
        bookshelf.style.display = "block"
        blockshelf.style.display = "none"
        blockedBooks = false;
    }

    let overflow_settings = 'auto'

    function getColor(backgroundImage) {
        let backgroundColor_book;
        let bordercolor_book;
        if (backgroundImage.includes('Books-1.png')) {
            backgroundColor_book = '#a93c39';
            bordercolor_book = '5px solid #5e343d';
        } else if (backgroundImage.includes('Books-2.png')) {
            backgroundColor_book = '#a93c39';
            bordercolor_book = '5px solid #7c434b';
        } else if (backgroundImage.includes('Books-3.png')) {
            backgroundColor_book = '#31497b';
            bordercolor_book = '5px solid #7c434b';  
        } else if (backgroundImage.includes('Books-4.png')) {
            backgroundColor_book = '#aa3b39';
            bordercolor_book = '5px solid #7a4548';  
        } else if (backgroundImage.includes('Books-5.png')) {
            backgroundColor_book = '#554068';
            bordercolor_book = '5px solid #79444c';  
        } else if (backgroundImage.includes('Books-6.png')) {
            backgroundColor_book = '#575553';
            bordercolor_book = '5px solid #7a444b';  
        } else if (backgroundImage.includes('Books-7.png')) {
            backgroundColor_book = '#387c43';
            bordercolor_book = '5px solid #794449';  
        }
        return {
            backgroundColor: backgroundColor_book,
            borderColor: bordercolor_book
        };
    }

    function mcToHtml(input) {
        const colorCodes = {
            '§0': '#000000', // Black
            '§1': '#0000AA', // Dark Blue
            '§2': '#00AA00', // Dark Green
            '§3': '#00AAAA', // Dark Aqua
            '§4': '#AA0000', // Dark Red
            '§5': '#AA00AA', // Dark Purple
            '§6': '#FFAA00', // Gold
            '§7': '#AAAAAA', // Gray
            '§8': '#555555', // Dark Gray
            '§9': '#5555FF', // Blue
            '§a': '#55FF55', // Green
            '§b': '#55FFFF', // Aqua
            '§c': '#FF5555', // Red
            '§d': '#FF55FF', // Light Purple
            '§e': '#FFFF55', // Yellow
            '§f': '#FFFFFF', // White
            '§r': null       // Reset
        };
    
        let output = '';
        let currentOpenTag = '';
    
        for (let i = 0; i < input.length; i++) {
            if (input[i] === '§' && i < input.length - 1) {
                const code = input[i] + input[i + 1];
                if (currentOpenTag) {
                    output += '</span>';
                    currentOpenTag = '';
                }
                if (colorCodes[code] !== undefined) {
                    if (colorCodes[code]) {
                        currentOpenTag = `<span style="color:${colorCodes[code]};">`;
                        output += currentOpenTag;
                    }
                    i++;
                }
            } else {
                output += input[i];
            }
        }
        if (currentOpenTag) {
            output += '</span>';
        }
        return output;
    }

    function openBookReader(bookKey) {
        const element = document.getElementById(`book${bookKey}`);
        let bookData;
        if (getFilter() == 'saved' && saved_book_list) {
            bookData = saved_book_list[bookKey];
        } else if (search ) {
            bookData = results[bookKey]
        } else {
            const main_key = Object.keys(loaded_books)[bookKey];
            bookData = loaded_books[main_key];
        }
        const title = document.getElementById('book-title');
        const author = document.getElementById('book-author');
        const book_text = document.getElementById('book-description');
        current_page = 0;
        if (1 == 4) {
            const ID = `book${bookKey}`
            const blocked_book = document.getElementById(ID); 
            const backgroundImage = window.getComputedStyle(blocked_book).getPropertyValue('background-image');
            const { backgroundColor, borderColor } = getColor(backgroundImage);
            bookreader_title_container.style.backgroundColor = backgroundColor;
            bookreader_title_container.style.borderColor = borderColor;
        } else {
            if (blockedBooks) {
                bookreader_title_container.style.backgroundColor = element.style.backgroundColor;
                bookreader_title_container.style.border = element.style.borderColor;
            } else {
                const bookElement = document.getElementById(element.id);
                const backgroundImage = window.getComputedStyle(bookElement).getPropertyValue('background-image');
                const { backgroundColor, borderColor } = getColor(backgroundImage);
                bookreader_title_container.style.backgroundColor = backgroundColor;
                bookreader_title_container.style.border = borderColor;
            }
            book_text.innerText = 'Loading...'
            author.innerText = 'Loading...'
            const book_id =  bookData['author'] + '_' + bookData['title'];
            const get_page = getPage(book_id);
            if (get_page) {
                current_page = parseInt(get_page)
            }
            const button_element = document.getElementById('saved-buttonDIV');
            let saved_list = fromCache('saved_list');
            if (!saved_list) {
                saved_list = [];
            }
            if (!saved_list.includes(book_id)) {
                button_element.style.backgroundImage = "url('/ASSETS/unsaved.png')";
            } else {
                button_element.style.backgroundImage = "url('/ASSETS/saved.png')";
            }
            loadBookContent(book_id).then((bookContent) => {
                title.innerText = bookContent.title;
                author.innerText = `By ${bookContent.author}`;
                book_text.innerHTML = mcToHtml(bookContent.pages[0]);
                book_content = bookContent;
                updatePageCount(bookContent)
            });
            
        }
        bookreader.style.display = 'block';
        document.body.style.pointerEvents = 'none';
        overflow_settings = document.body.style.overflowY;
        hide_descr()
    }

    window.gotoNextPage = function() {
        const book_text = document.getElementById('book-description');
        if (current_page + 1 < book_content['pages'].length) {
            current_page += 1;
            book_text.innerHTML = mcToHtml(book_content['pages'][current_page]);
            updatePageCount(book_content);
        }
    };
    
    window.gotoprevPage = function() {
        const book_text = document.getElementById('book-description');
        if (current_page > 0) {
            current_page -= 1;
            book_text.innerHTML = mcToHtml(book_content['pages'][current_page]);
            updatePageCount(book_content)
        }
    }

    window.closeBookReader = function() {
        bookreader.style.display = 'none';
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflowY = overflow_settings;
    }

    function updatePageCount(book_content) {
        setPage(book_content.author + '_' + book_content.title, current_page)
        const page_count = document.getElementById('page_count');
        page_count.innerText = `(${current_page + 1} / ${book_content['pages'].length})`;
    }

    window.searchBar = function() {
        const search_bar = document.getElementById('search_bar');

        let book_list = loaded_books; 
        if (getFilter() == 'saved') {
            let new_book_dict = {}
            for (var i = 0; i < saved_book_list.length; i++) {
                let temp_book_id = saved_book_list[i].author + '_' + saved_book_list[i].title;
                new_book_dict[temp_book_id] = saved_book_list[i];
            }
            book_list = new_book_dict;
        }

        if (!blockedBooks) {
            if (!search_bar.value) {
                renderBooksShelf(book_list);
            } else {
                const results = searchBooks(book_list, search_bar.value);
                renderBooksShelf(results);
            }
        } else {
            if (!search_bar.value) {
                gotoBlock(book_list)
            } else {
                const results = searchBooks(book_list, search_bar.value);
                gotoBlock(results)
            }
        }

        if (search_bar.value) {
            search = true;
        } else {
            search = false
        }
    }

    function searchBooks(library, searchTerm) {
        results = [];
        
        for (const [key, book] of Object.entries(library)) {
            const [author, bookName] = key.split('_');
            
            if (author.toLowerCase().includes(searchTerm.toLowerCase()) || 
                bookName.toLowerCase().includes(searchTerm.toLowerCase())) {
                results.push({ key: key, ...book });
            }
        }
        
        return results;
    }


    function gotoBlock(book_list) {
        if (search) {
            renderBooksShelf(book_list);
        }
        blockshelf.innerHTML = '';
        for (var i = 0; i < Object.keys(book_list).length; i++) {
            const amount = i;
            const main_key = Object.keys(book_list)[i];
            const bookData = book_list[main_key];
            const bookID = `book${i}`;
            const bookElement = document.getElementById(bookID);
            const blockBook = document.createElement('div');
            blockBook.className = 'bookBlock';
            blockBook.id = bookID;

            const backgroundImage = window.getComputedStyle(bookElement).getPropertyValue('background-image');
            const { backgroundColor, borderColor } = getColor(backgroundImage);
            blockBook.style.backgroundColor = backgroundColor;
            blockBook.style.border = borderColor;

            const blockBook_title = document.createElement('h2');
            blockBook_title.innerText = bookData['title'];
            blockBook_title.style.textAlign = 'center';
            blockBook_title.style.fontWeight = '800';

            const blockBook_descr = document.createElement('p');
            blockBook_descr.innerText = bookData['descr'];
            blockBook_descr.style.textAlign = 'center';
            blockBook_descr.style.fontWeight = '600';

            const blockBook_author = document.createElement('p');
            blockBook_author.innerText = 'Written by ' + bookData['author'];
            blockBook_author.style.textAlign = 'center';
            blockBook_author.style.fontWeight = '800';

            blockBook.appendChild(blockBook_title);
            blockBook.appendChild(blockBook_descr);
            blockBook.appendChild(blockBook_author);

            blockBook.onclick = function() {
                openBookReader(amount);
            }

            blockshelf.appendChild(blockBook);
        }
    }

    window.saveBook = function() {
        const button_element = document.getElementById('saved-buttonDIV');
        const book_id = `${book_content.author}_${book_content.title}`;
        let saved_list = fromCache('saved_list');
        if (!saved_list) {
            saved_list = [];
        }
        if (!saved_list.includes(book_id)) {
            saved_list.push(book_id)
            button_element.style.backgroundImage = "url('/ASSETS/saved.png')";
        } else {
            saved_list = saved_list.filter(item => item !== book_id);
            button_element.style.backgroundImage = "url('/ASSETS/unsaved.png')";
        }
        toCache(saved_list, 'saved_list');
    }

    function toCache(list, key) {
        localStorage.setItem(key, JSON.stringify(list));        
    }

    function fromCache(key) {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue);
        } else {
            return null;
        }
    }

    window.reloadPage = function() {
        location.replace(location.href);
    }

    window.changedFilter = function() {
        const sort_button = document.getElementById('sort-button');
        if (sort_button.value == 'saved') {
            let saved_list = fromCache('saved_list');
            if (!saved_list) {
                saved_list = []
            }
            saved_book_list = []
            for (let i = 0; i < Object.keys(loaded_books).length; i++) {
                const key = Object.keys(loaded_books)[i];
                for (let x = 0; x < saved_list.length; x++) {
                    if (saved_list[x] == key) {
                        saved_book_list.push(loaded_books[key])
                        break;
                    }
                }
            }
            if (blockedBooks) {
                gotoBlock(saved_book_list)
            } else {
                renderBooksShelf(saved_book_list)
            }
        } else {
            if (blockedBooks) {
                gotoBlock(loaded_books)
            } else {
                renderBooksShelf(loaded_books)
            }
        }
    }

    function getFilter() {
        return document.getElementById('sort-button').value;
    }

    function setPage(book_id, page) {
        localStorage.setItem(book_id, page); 
    }

    function getPage(book_id) {
        const storedValue = localStorage.getItem(book_id);
        if (storedValue) {
            return storedValue;
        } else {
            return null;
        }
    }
});
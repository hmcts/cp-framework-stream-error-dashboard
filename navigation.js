// navigation.js

let navigationStack = [];
let currentHash = null;

function pushNavigation(nav) {
    navigationStack.push(nav);
}

function popNavigation() {
    return navigationStack.pop();
}

function clearNavigation() {
    navigationStack = [];
}

function hasBack() {
    return navigationStack.length > 0;
}

function setCurrentHash(hash) {
    currentHash = hash;
}

function getCurrentHash() {
    return currentHash;
} 
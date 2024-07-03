function toggleMenu(menuId, parentId) {
    let sousMenu = document.getElementById(menuId);
    let parent = document.getElementById(parentId);
    if (sousMenu.classList.contains('active')) {
        sousMenu.classList.remove('active');
    } else {
        sousMenu.classList.add('active');
        sousMenu.style.witdh = `${parent.offsetWidth}px`;
    }
}



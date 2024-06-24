function toggleMenu() {
    let sousMenu = document.getElementById('sousMenuA');
    if (sousMenu.classList.contains('active')) {
        sousMenu.classList.remove('active');
    } else {
        sousMenu.classList.add('active');
    }
}

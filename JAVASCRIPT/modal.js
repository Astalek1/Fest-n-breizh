// Fonction pour afficher le modal avec l'image agrandie
document.querySelectorAll('.affiches a').forEach(item => {
    item.addEventListener('click', event => {
        event.preventDefault();
        const imgSrc = item.getAttribute('href');
        const modal = document.getElementById('myModal');
        const modalImg = document.getElementById('modalImg');
        modal.style.display = "block";
        modalImg.src = imgSrc;
        document.body.classList.add('no-scroll'); // Bloque le défilement
    });
});

// Fonction pour fermer le modal
function closeModal() {
    document.getElementById('myModal').style.display = "none";
    document.body.classList.remove('no-scroll'); // Débloque le défilement
}

// Ferme le modal lorsqu'on clique en dehors de l'image
window.onclick = function(event) {
    const modal = document.getElementById('myModal');
    if (event.target == modal) {
        modal.style.display = "none";
        document.body.classList.remove('no-scroll'); // Débloque le défilement
    }
};

 
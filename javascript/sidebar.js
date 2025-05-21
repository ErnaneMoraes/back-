// Função para definir o link ativo na sidebar
document.addEventListener('DOMContentLoaded', function() {
    
    var menuItem = document.querySelectorAll('.side-item')

    function selectLink() {
        menuItem.forEach((item) => 
            item.classList.remove('active')
        )
        this.classList.add('active')
    }

    menuItem.forEach((item) =>
        item.addEventListener('click', selectLink)
    )

});


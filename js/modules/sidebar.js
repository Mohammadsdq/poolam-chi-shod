
export const initializeSidebar = () => {

    const sidebar = document.getElementById("sidebar");

    const menuToggle = document.getElementById("menuToggle");

    const closeSidebar = document.getElementById("closeSidebar");

    const overlay = document.getElementById("sidebarOverlay");


    const openMenu = () => {
        sidebar.classList.add("open");
        overlay.classList.add("active");
    };


    const closeMenu = () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    };


    menuToggle.addEventListener("click", openMenu);

    closeSidebar.addEventListener("click", closeMenu);

    overlay.addEventListener("click", closeMenu);


    // CLOSE SIDEBAR WITH ESCAPE

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeMenu();
        }

    });

};

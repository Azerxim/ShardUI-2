const showModal = (config) => {
    const modal = document.getElementById(config.id);
    if (modal) {
        modal.showModal();
    }
};

export { showModal };
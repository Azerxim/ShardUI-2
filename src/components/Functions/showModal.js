const showModal = (config, mode = "default") => {
    const modal = document.getElementById(config.id[mode]);
    if (modal) {
        modal.showModal();
    }
};

export { showModal };
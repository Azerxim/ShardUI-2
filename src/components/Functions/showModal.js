const showModal = (config, mode = "default", local = { id: null }) => {
    const modal = document.getElementById(config.id[mode].replace("$local-id", local.id));
    if (modal) {
        modal.showModal();
    }
};

export { showModal };
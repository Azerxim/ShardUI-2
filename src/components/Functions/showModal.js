const showModal = (config, mode = "default", local = { id: null }) => {
    const modal = document.getElementById(config.id[mode].replace("$local-id", local.id));
    // console.log("showModal", config.id[mode], local.id, modal);
    if (modal) {
        modal.showModal();
    }
};

const showModalID = (id) => {
    const modal = document.getElementById(id);
    // console.log("showModal", id, local.id, modal);
    if (modal) {
        modal.showModal();
    }
};

export { showModal, showModalID };
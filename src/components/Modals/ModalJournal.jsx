import React, { useEffect, useState } from "react";
import Modal from "react-modal";

export default function ModalJournal({ isOpen, onRequestClose, journalEntry }) {
//   const [entry, setEntry] = useState(journalEntry || { title: "", content: "" });

//   useEffect(() => {
//     setEntry(journalEntry || { title: "", content: "" });
//   }, [journalEntry]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setEntry((prevEntry) => ({ ...prevEntry, [name]: value }));
//   };

//   const handleSave = () => {
//     // Logic to save the journal entry
//     onRequestClose();
//   };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Modal Journal">
      {/* <h2>{journalEntry ? "Edit Journal Entry" : "New Journal Entry"}</h2>
      <form>
        <label>
          Title:
          <input type="text" name="title" value={entry.title} onChange={handleChange} />
        </label>
        <br />
        <label>
          Content:
          <textarea name="content" value={entry.content} onChange={handleChange} />
        </label>
        <br />
        <button type="button" onClick={handleSave}>
          Save
        </button>
        <button type="button" onClick={onRequestClose}>
          Cancel
        </button>
      </form> */}
    </Modal>
  );
}
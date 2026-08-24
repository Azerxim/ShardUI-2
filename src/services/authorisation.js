export function checkMemberAuth(members, setAuth = () => { }) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        const checkUserAdmin = user && user.is_admin;
        const checkMemberID = members && members.some(member => member.user_id === user.id)
        const checkMemberRole = members && (members.find(member => member.user_id === user.id)?.role === "Fondateur" || members.find(member => member.user_id === user.id)?.role === "Admin");
    
        // console.log("checkUserAdmin:", checkUserAdmin);
        // console.log("checkMemberID:", checkMemberID);
        // console.log("checkMemberRole:", checkMemberRole);
        // console.log("checkResult: ", user && user.id && (checkMemberID && checkMemberRole) || checkUserAdmin)
    
        if (user.id && 
            (checkMemberID && checkMemberRole) ||
            checkUserAdmin) {
            setAuth(true);
            return true;
        } else {
            setAuth(false);
            return false;
        }
    } else {
        setAuth(false);
        return false;
    }
}

export function checkUserID(userID, setAuth = () => { }) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        const checkUserAdmin = user && user.is_admin;
        const checkUserID = user && user.id === userID;
    
        // console.log("checkUserAdmin:", checkUserAdmin);
        // console.log("checkUserID:", checkUserID);
    
        if (
            user && 
            user.id && 
            (checkUserID) ||
            checkUserAdmin) {
            setAuth(true);
        } else {
            setAuth(false);
        }
    } else {
        setAuth(false);
    }
}
const appendix = async (text) => {
    const div = document.createElement("div");
    div.id = text;
    div.textContent = text;
    document.body.append(div);
};
export { appendix };

export async function getData(url) {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return data;
}
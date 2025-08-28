export function cldUrl(publicId, opts = {}) {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    // parâmetros padrão
    const {
        width = 500,
        height = 500,
        crop = "fill",
        gravity = "auto",
        fetch_format = "auto",
        quality = "auto",
    } = opts;

    const transform = [
        `f_${fetch_format}`,
        `q_${quality}`,
        `c_${crop}`,
        `g_${gravity}`,
        `w_${width}`,
        `h_${height}`,
    ].join(",");

    return `https://res.cloudinary.com/${cloud}/image/upload/${transform}/${publicId}`;
}

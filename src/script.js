const clientId = config.MY_KEY; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
var num = 5;
var ran = false;

var profile;
var currentlyPlaying;
var topSongs;
var topArtists;

const inputElement = document.getElementById("myInput");

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    profile = await fetchProfile(accessToken);
    currentlyPlaying = await getCurrentlyPlayingTrack(accessToken);
    topSongs = await getTopSongs(accessToken, 50);
    topArtists = await getTopArtists(accessToken, 50);

    populateUI();
}

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email user-read-currently-playing user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function getCurrentlyPlayingTrack(token) {
    const result = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function getTopSongs(token, amount) {
    let endpoint = "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=" + amount;

    const result = await fetch(endpoint, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function getTopArtists(token, amount) {
    let endpoint = "https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=" + amount;

    const result = await fetch(endpoint, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

function populateUI() {
    if (!ran){
        document.getElementById("displayName").innerText = profile.display_name;
        if (profile.images[0]) {
            const profileImage = new Image(200, 200);
            profileImage.src = profile.images[0].url;
            document.getElementById("avatar").appendChild(profileImage);
        }
        document.getElementById("id").innerText = profile.id;
        document.getElementById("trackName").innerText = currentlyPlaying.item.name;

        ran = true;
    }

    document.getElementById("songList").innerHTML = "";
    for (let i = 0; i < num; i++) {
        document.getElementById("songList").innerHTML += "<li><span>" + topSongs.items[i].name + "</span></li>";
    }
    
    document.getElementById("artistList").innerHTML = "";
    for (let i = 0; i < num; i++) {
        document.getElementById("artistList").innerHTML += "<li><span>" + topArtists.items[i].name + "</span></li>";
    }

    document.getElementById("artistImages").innerHTML = "";
    // top artists images
    for (let i = 0; i < num; i++) {
        document.getElementById("artistImages").innerHTML += 
        "<li><span>" + topArtists.items[i].name + 
        "<br></span><img src=\"" + topArtists.items[i].images[0].url + "\"/>" + "</li>";
    }

    document.getElementById("genreList").innerHTML = "";
    //top genres -- this gives the genre of the top artists respectively
    for (let i = 0; i < num; i++) {
        document.getElementById("genreList").innerHTML += "<li><span>" + topArtists.items[i].genres[0] + "</span></li>";
    }
}

inputElement.addEventListener("input", function() {
  const inputValue = this.value;
  num = inputValue;

  populateUI();
});

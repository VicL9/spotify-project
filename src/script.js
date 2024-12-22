const clientId = config.MY_KEY; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
var num = 5;
var ran = false;

var profile;
var currentlyPlaying;
var topSongsShortTerm;
var topSongsMediumTerm;
var topSongsLongTerm;
var topArtistsShortTerm;
var topArtistsMediumTerm;
var topArtistsLongTerm;

var topSongs;
var topArtists;

const numInput = document.getElementById("myInput");
const numButton = document.getElementById("submitBtn");

const shortTermButton = document.getElementById("shortTerm");
const mediumTermButton = document.getElementById("mediumTerm");
const longTermButton = document.getElementById("longTerm");


if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    profile = await fetchProfile(accessToken);
    currentlyPlaying = await getCurrentlyPlayingTrack(accessToken);
    topSongsShortTerm = await getTopSongs(accessToken, 50, "short_term");
    topSongsMediumTerm = await getTopSongs(accessToken, 50, "medium_term");
    topSongsLongTerm = await getTopSongs(accessToken, 50, "long_term");
    topArtistsShortTerm = await getTopArtists(accessToken, 50, "short_term");
    topArtistsMediumTerm = await getTopArtists(accessToken, 50, "medium_term");
    topArtistsLongTerm = await getTopArtists(accessToken, 50, "long_term");

    topSongs = topSongsShortTerm;
    topArtists = topArtistsShortTerm;

    console.log(topSongsShortTerm);
    console.log(topSongs);


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

async function getTopSongs(token, amount, time_range) {
    let endpoint = "https://api.spotify.com/v1/me/top/tracks?time_range=" + time_range + "&limit=" + amount;

    const result = await fetch(endpoint, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function getTopArtists(token, amount, time_range) {
    let endpoint = "https://api.spotify.com/v1/me/top/artists?time_range=" + time_range + "&limit=" + amount;

    const result = await fetch(endpoint, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

function populateUI() {
    if (!ran) {
        document.getElementById("displayName").innerText = profile.display_name;
        if (profile.images[0]) {
            const profileImage = new Image(100, 100);
            profileImage.src = profile.images[0].url;
            profileImage.style.borderRadius = "50%";
            document.getElementById("avatar").appendChild(profileImage);
        }
        document.getElementById("id").innerText = "@" + profile.id;
        document.getElementById("trackName").innerText = currentlyPlaying.item.name + " - " + currentlyPlaying.item.artists[0].name;

        ran = true;
    }

    // // top songs info!
    // document.getElementById("songList").innerHTML = "";
    // for (let i = 0; i < num; i++) {
    //     document.getElementById("songList").innerHTML += "<li><span>" + topSongs.items[i].name + "</span></li>";
    // }

   // actually top songs info!
   document.getElementById("trackImages").innerHTML = "";
   // top track images
   for (let i = 0; i < num; i++) {
       // track card containing img and track name
       const trackCard = document.createElement("div");
       trackCard.classList.add("track-card");

       // num track
       const numTrack = document.createElement("p");
       numTrack.style.fontSize = "30px"
       numTrack.textContent = i+1 + ".";


       // track img 
       const img = document.createElement("img");
       img.src = topSongs.items[i].album.images[0].url;
       img.alt = topSongs.items[i].name;

       // track name
       const name = document.createElement("p");
       name.textContent = topSongs.items[i].name + " - " + topSongs.items[i].artists[0].name;

       // add img and name to card
       trackCard.appendChild(numTrack);
       trackCard.appendChild(img);
       trackCard.appendChild(name);

       document.getElementById("trackImages").appendChild(trackCard);
   }


       // actually top artists info!
    document.getElementById("artistImages").innerHTML = "";
    // top artists images
    for (let i = 0; i < num; i++) {
        // artist card containing img and artist name
        const artistCard = document.createElement("div");
        artistCard.classList.add("artist-card");

        // artist img 
        const img = document.createElement("img");
        img.src = topArtists.items[i].images[0].url;
        img.alt = topArtists.items[i].name;

        // artist name
        const name = document.createElement("p");
        name.textContent = i+1 + ". " + topArtists.items[i].name;

        // add img and name to card
        artistCard.appendChild(img);
        artistCard.appendChild(name);

        document.getElementById("artistImages").appendChild(artistCard);
        // document.getElementById("artistImages").innerHTML += 
        // "<img src=\"" + topArtists.items[i].images[0].url + "\"/>";
        
    }

    // actually top artists info!
    document.getElementById("artistImages").innerHTML = "";
    // top artists images
    for (let i = 0; i < num; i++) {
        // artist card containing img and artist name
        const artistCard = document.createElement("div");
        artistCard.classList.add("artist-card");

        // artist img 
        const img = document.createElement("img");
        img.src = topArtists.items[i].images[0].url;
        img.alt = topArtists.items[i].name;

        // artist name
        const name = document.createElement("p");
        name.textContent = i+1 + ". " + topArtists.items[i].name;

        // add img and name to card
        artistCard.appendChild(img);
        artistCard.appendChild(name);

        document.getElementById("artistImages").appendChild(artistCard);
        // document.getElementById("artistImages").innerHTML += 
        // "<img src=\"" + topArtists.items[i].images[0].url + "\"/>";
        
    }

    document.getElementById("genreList").innerHTML = "";
    //top genres -- this gives the genre of the top artists respectively
    for (let i = 0; i < num; i++) {
        document.getElementById("genreList").innerHTML += "<li><span>" + topArtists.items[i].genres[0] + "</span></li>";
    }
}

numButton.addEventListener("click", function() {
  const inputValue = numInput.value;
  num = inputValue;

  populateUI();
});

shortTermButton.addEventListener("click", function() {
    topSongs = topSongsShortTerm;
    topArtists = topArtistsShortTerm;
  
    populateUI();
  });

mediumTermButton.addEventListener("click", function() {
    topSongs = topSongsMediumTerm;
    topArtists = topArtistsMediumTerm;
  
    populateUI();
});

longTermButton.addEventListener("click", function() {
    topSongs = topSongsLongTerm;
    topArtists = topArtistsLongTerm;
  
    populateUI();
});


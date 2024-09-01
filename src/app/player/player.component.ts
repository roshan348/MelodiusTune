import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
})
export class PlayerComponent implements OnInit {
  currentSong = new Audio();
  songs: string[] = [];
  albums: any[] = [];
  currFolder: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.displayAlbums();
  }

  async getSongs(folder: string): Promise<void> {
    this.currFolder = folder;
    try {
      const response = await this.http
        .get(`/assets/songs/${folder}/`)
        .toPromise();
      const parser = new DOMParser();
      const doc = parser.parseFromString(response as string, 'text/html');
      const links = doc.getElementsByTagName('a');

      this.songs = Array.from(links)
        .filter((link) => link.href.endsWith('.mp3'))
        .map((link) => decodeURI(link.href.split(`/${folder}/`)[1]));

      this.updateSongList();
      this.playMusic(this.songs[0]);
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  }

  updateSongList(): void {
    const songUl = document.querySelector('.songList ul');
    if (songUl) {
      songUl.innerHTML = '';
      this.songs.forEach((song) => {
        songUl.innerHTML += `
          <li>
            <img class="invert" src="img/music.svg" alt="" />
            <div class="info">
              <div>${song.replaceAll('%20', ' ')}</div>
              <div>Artist</div>
            </div>
            <div class="playnow">
              <span>Play Now</span>
              <img src="./img/play_circle.svg" alt="" />
            </div>
          </li>`;
      });
      Array.from(document.querySelectorAll('.songList li')).forEach((li) => {
        li.addEventListener('click', (e) => {
          const songName = (e.currentTarget as HTMLElement)
            .querySelector('.info div')!
            .innerHTML.trim();
          this.playMusic(songName);
        });
      });
    }
  }

  playMusic(track: string, pause = false): void {
    if (this.currFolder) {
      this.currentSong.src = `/assets/songs/${this.currFolder}/` + track;
      if (!pause) {
        this.currentSong.play();
        document.querySelector('#play')!.setAttribute('src', 'img/pause.svg');
      }
      document.querySelector('.songinfo')!.innerHTML = decodeURI(track);
      document.querySelector('.songtime')!.innerHTML = '00:00 / 00:00';
    }
  }

  async displayAlbums(): Promise<void> {
    try {
      const response = await this.http.get('/assets/songs/').toPromise();
      const parser = new DOMParser();
      const doc = parser.parseFromString(response as string, 'text/html');
      const folders = Array.from(doc.getElementsByTagName('a'));

      const cardContainer = document.querySelector('.cardContainer');
      if (cardContainer) {
        cardContainer.innerHTML = '';
        for (const folder of folders) {
          if (folder.href.includes('/songs/')) {
            const folderName = folder.href.split('/').slice(-2, -1)[0];
            try {
              const albumData = await this.http
                .get(`/assets/songs/${folderName}/info.json`)
                .toPromise();
              const album = albumData as { title: string; description: string };
              cardContainer.innerHTML += `
                <div data-folder="${folderName}" class="card">
                  <div class="play">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="black" style="margin-bottom: 10px">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <img src="/assets/songs/${folderName}/cover.jpg" alt="" />
                  <h2>${album.title}</h2>
                  <p>${album.description}</p>
                </div>`;
            } catch (error) {
              console.error(
                `Error fetching album data for ${folderName}:`,
                error
              );
            }
          }
        }

        Array.from(document.getElementsByClassName('card')).forEach((card) => {
          card.addEventListener('click', (e) => {
            const folderName = (e.currentTarget as HTMLElement).dataset[
              'folder'
            ]!;
            this.getSongs(folderName);
          });
        });
      }
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  }
  adjustVolume(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement && this.currentSong) {
      this.currentSong.volume = parseFloat(inputElement.value) / 100;
    }
  }
}

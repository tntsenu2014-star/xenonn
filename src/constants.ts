export interface Game {
  id: string;
  name: string;
  image: string;
  category: string;
  tag: string;
  comingSoon?: boolean;
  idLabel?: string;
  idPlaceholder?: string;
}

export const GAMES: Game[] = [
  {
    id: 'freefire-sg',
    name: 'Free Fire (SG/MY)',
    image: 'https://i.ibb.co/vRrRZ78/Chat-GPT-Image-Apr-29-2026-04-57-50-PM.png',
    category: 'Action',
    tag: 'ACTIVE',
    idLabel: 'Player ID',
    idPlaceholder: 'Ex: 123456789'
  },
  {
    id: 'pubg-mobile',
    name: 'PUBG Mobile',
    image: 'https://upload.wikimedia.org/wikipedia/en/4/44/PlayerUnknown%27s_Battlegrounds_Mobile.webp',
    category: 'Battle Royale',
    tag: 'ACTIVE',
    idLabel: 'Character ID',
    idPlaceholder: 'Ex: 5123456789'
  },
  {
    id: 'delta-force',
    name: 'Delta Force',
    image: 'https://i.ibb.co/XZ1sf6Xs/Chat-GPT-Image-Apr-29-2026-07-19-02-PM.png',
    category: 'FPS',
    tag: 'COMING SOON',
    comingSoon: true
  },
  {
    id: 'blood-strike',
    name: 'Blood Strike',
    image: 'https://play-lh.googleusercontent.com/Lv1XpRDOaNmxZPWkix0FVyfaLYeNnVwZEUGl9QGwY_tu36xgUbQXNtpYWrMBpib7e-JonRYUjl2GnjKr0rftgw=w240-h480-rw',
    category: 'Shooter',
    tag: 'ACTIVE',
    idLabel: 'Player ID',
    idPlaceholder: 'Ex: 123456789'
  },
  {
    id: 'pubg-new-state',
    name: 'PUBG New State',
    image: 'https://cdn.moogold.com/2022/02/PUBG-New-State-Logo.png',
    category: 'Action',
    tag: 'ACTIVE',
    idLabel: 'Account ID',
    idPlaceholder: 'Ex: 123456789'
  },
  {
    id: 'freefire-indo',
    name: 'Free Fire (Indonesia)',
    image: 'https://i.postimg.cc/J092mvtH/Chat-GPT-Image-Apr-29-2026-05-03-40-PM.png',
    category: 'Action',
    tag: 'ACTIVE',
    idLabel: 'Player ID',
    idPlaceholder: 'Ex: 123456789'
  },
  {
    id: 'where-winds-meet',
    name: 'Where Winds Meet',
    image: 'https://play-lh.googleusercontent.com/C077FpQVnL7G5O6Mowj-sWKdTjUwEWAWxOVQUcBwhHY1yOZePOoIxtlOS5Tn9kIzLoI2eU8BWZ4Nh4ufS63zBg',
    category: 'Adventure',
    tag: 'COMING SOON',
    comingSoon: true
  },
  {
    id: 'valorant-sg',
    name: 'Valorant (Singapore)',
    image: 'https://store-images.s-microsoft.com/image/apps.21507.13663857844271189.4c1de202-3961-4c40-a0aa-7f4f1388775a.20ed7782-0eda-4f9d-b421-4cc47492edc6',
    category: 'Tactical Shooter',
    tag: 'ACTIVE',
    idLabel: 'Riot ID',
    idPlaceholder: 'Ex: Username#Tag'
  }
];

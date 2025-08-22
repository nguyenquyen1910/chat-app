import { config } from "dotenv";
import { connectDB } from "../lib/db";
import User from "../models/userModel";

config();

const seedUsers = [
  // Goalkeepers
  {
    email: "thibaut.courtois@realmadrid.com",
    fullName: "Thibaut Courtois",
    password: "123456",
    profilePic:
      "https://www.shutterstock.com/editorial/image-editorial/McTbI43fMdzfQ6y9MjI3MTI=/thibaut-courtois-real-madrid-full-time-440nw-12627371bz.jpg",
  },
  {
    email: "andriy.lunin@realmadrid.com",
    fullName: "Andriy Lunin",
    password: "123456",
    profilePic:
      "https://static.bongda24h.vn/medias/original/2025/02/28/tieu-su-cau-thu-andriy-lunin-2802153935.jpg",
  },

  // Defenders
  {
    email: "dani.carvajal@realmadrid.com",
    fullName: "Dani Carvajal",
    password: "123456",
    profilePic:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvJt0oRha47Dvj-0_NzA1wFQ4yg4ZHkajmGg&s",
  },
  {
    email: "antonio.rudiger@realmadrid.com",
    fullName: "Antonio Rüdiger",
    password: "123456",
    profilePic: "https://s.hs-data.com/bilder/spieler/gross/174182.jpg",
  },
  {
    email: "david.alaba@realmadrid.com",
    fullName: "David Alaba",
    password: "123456",
    profilePic:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcxdNxGGUyHM0Lh_okmJJbgZl1NEPUWlpEFQ&s",
  },
  {
    email: "ferland.mendy@realmadrid.com",
    fullName: "Ferland Mendy",
    password: "123456",
    profilePic:
      "https://static.bongda24h.vn/medias/standard/2025/07/25/ferland-mendy-2507170023.jpg",
  },
  {
    email: "eduardo.camavinga@realmadrid.com",
    fullName: "Eduardo Camavinga",
    password: "123456",
    profilePic:
      "https://static.bongda24h.vn/medias/standard/2023/01/21/3-2101223044.jpg",
  },
  {
    email: "alexander.arnold@realmadrid.com",
    fullName: "Trent Alexander Arnold",
    password: "123456",
    profilePic:
      "https://www.defensacentral.com/uploads/s1/39/22/59/3/trent-alexander-arnold-madrid.jpeg",
  },
  {
    email: "fran.garcia@realmadrid.com",
    fullName: "Fran García",
    password: "123456",
    profilePic:
      "https://www.les-transferts.com/wp-content/uploads/2025/04/Fran-Garcia-courtise-par-la-Juve-%C2%A9Alamy.webp",
  },

  // Midfielders
  {
    email: "ceballos.daniel@realmadrid.com",
    fullName: "Daniel Ceballos",
    password: "123456",
    profilePic:
      "https://static.bongda24h.vn/medias/original/2025/03/03/tieu_su_tien_ve_dani_ceballos.jpg",
  },
  {
    email: "federico.valverde@realmadrid.com",
    fullName: "Federico Valverde",
    password: "123456",
    profilePic:
      "https://image-service.onefootball.com/transform?w=280&h=210&dpr=2&image=https%3A%2F%2Fguatefutbol.com%2Fwp-content%2Fuploads%2F2025%2F02%2FFederico-Valverde-Real-Madrid-1.jpg",
  },
  {
    email: "aurelien.tchouameni@realmadrid.com",
    fullName: "Aurélien Tchouaméni",
    password: "123456",
    profilePic:
      "https://www.getfootballnewsfrance.com/assets/elche-cf-v-real-madrid-cf-laliga-santander-1-1-scaled.jpg",
  },
  {
    email: "jude.bellingham@realmadrid.com",
    fullName: "Jude Bellingham",
    password: "123456",
    profilePic:
      "https://image.discovery.indazn.com/ca/v2/ca/image?id=1vw61v47uusyq11ztcq79762ma_image-header_pRow_1750658985000&quality=50",
  },
  {
    email: "brahim.diaz@realmadrid.com",
    fullName: "Brahim Díaz",
    password: "123456",
    profilePic:
      "https://media.video-cdn.espn.com/motion/2024/0825/ss_20240825_125958750_2622666789/ss_20240825_125958750_2622666789.jpg",
  },

  // Forwards
  {
    email: "vinicius.junior@realmadrid.com",
    fullName: "Vinícius Júnior",
    password: "123456",
    profilePic:
      "https://pontianakinfo.disway.id/upload/bcdb166cfa1ee7eedf766cf3e615250a.jpeg",
  },
  {
    email: "rodrygo.goes@realmadrid.com",
    fullName: "Rodrygo Goes",
    password: "123456",
    profilePic:
      "https://photo.znews.vn/w960/Uploaded/bpivpawv/2025_02_11/rodrygo.jpg",
  },
  {
    email: "mbappe.kilyan@realmadrid.com",
    fullName: "Kylian Mbappé",
    password: "123456",
    profilePic:
      "https://ca-times.brightspotcdn.com/dims4/default/7e4ad5e/2147483647/strip/true/crop/3697x2465+0+0/resize/1200x800!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2Fc2%2Ffa%2F5eeeb5de34f0348e3391070e8595%2F9bc7f9e984e1483d861249fcbb0cc4b1",
  },
  {
    email: "garcia.gonzalo@realmadrid.com",
    fullName: "Gonzalo García",
    password: "123456",
    profilePic:
      "https://www.les-transferts.com/wp-content/uploads/2025/07/Real-Madrid-Gonzalo-Garcia-le-debut-de-la-fin.webp",
  },
  {
    email: "guller.gonzalo@realmadrid.com",
    fullName: "Arda Güller",
    password: "123456",
    profilePic:
      "https://s.yimg.com/ny/api/res/1.2/XmXSW3JAqUkWUEm9eaxhmw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTQyNztjZj13ZWJw/https://media.zenfs.com/en/madrid_voice_articles_898/3db7cdfb4c1e3d2fd61100c30c2878e1",
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    await User.insertMany(seedUsers);
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

seedDatabase();

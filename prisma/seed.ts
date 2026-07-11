import { Prisma, PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

import "dotenv/config"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before running the seed")
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
})

const prisma = new PrismaClient({
  adapter,
})

const participantData: Prisma.ParticipantCreateInput[] = [
  {
    name: "Pablo",
    players: {
      create: [
        {
          name: "E. Martínez",
          team: "Aston Villa",
          positions: ["GK"],
          overall: 85,
        },
        {
          name: "Vivian",
          team: "Athletic Club",
          positions: ["CB"],
          overall: 84,
        },
        {
          name: "J. Tah",
          team: "FC Bayern München",
          positions: ["CB"],
          overall: 87,
        },
        {
          name: "João Cancelo",
          team: "Al Hilal",
          positions: ["RB", "LB", "RM"],
          overall: 84,
        },
        {
          name: "G. Di Lorenzo",
          team: "Napoli",
          positions: ["RB", "CB", "RM"],
          overall: 83,
        },
        {
          name: "D. Rice",
          team: "Arsenal",
          positions: ["CDM", "CM"],
          overall: 87,
        },
        {
          name: "Vitinha",
          team: "Paris Saint-Germain",
          positions: ["CM", "CDM", "CAM"],
          overall: 89,
        },
        {
          name: "Fabián Ruiz",
          team: "Paris Saint-Germain",
          positions: ["CM", "CDM"],
          overall: 85,
        },
        {
          name: "A. Griezmann",
          team: "Atlético Madrid",
          positions: ["ST", "LM", "CAM"],
          overall: 85,
        },
        {
          name: "M. Thuram",
          team: "Inter",
          positions: ["ST"],
          overall: 85,
        },
        {
          name: "Matheus Cunha",
          team: "Manchester United",
          positions: ["CAM", "LW", "ST"],
          overall: 83,
        },
        {
          name: "P. Schick",
          team: "Bayer 04 Leverkusen",
          positions: ["ST"],
          overall: 85,
        },
        {
          name: "E. Camavinga",
          team: "Real Madrid",
          positions: ["CM", "CDM", "LB"],
          overall: 83,
        },
        {
          name: "Pedro Gonçalves",
          team: "Sporting CP",
          positions: ["CAM", "LM", "CM"],
          overall: 83,
        },
        {
          name: "Iago Aspas",
          team: "RC Celta",
          positions: ["RW", "ST", "RM"],
          overall: 83,
        },
        {
          name: "J. Brandt",
          team: "Borussia Dortmund",
          positions: ["CAM", "CM"],
          overall: 83,
        },
      ],
    },
  },
  {
    name: "Davi",
    players: {
      create: [
        {
          name: "De Gea",
          team: "Fiorentina",
          positions: ["GK"],
          overall: 85,
        },
        {
          name: "Marc Cucurella",
          team: "Chelsea",
          positions: ["LB"],
          overall: 84,
        },
        {
          name: "J. Koundé",
          team: "FC Barcelona",
          positions: ["RB", "CB", "RM"],
          overall: 87,
        },
        {
          name: "Nuno Mendes",
          team: "Paris Saint-Germain",
          positions: ["LB", "LM"],
          overall: 86,
        },
        {
          name: "Bremer",
          team: "Juventus",
          positions: ["CB"],
          overall: 85,
        },
        {
          name: "F. Wirtz",
          team: "Liverpool",
          positions: ["CAM", "ST", "CM"],
          overall: 89,
        },
        {
          name: "S. Milinković-Savić",
          team: "Al Hilal",
          positions: ["CM", "CDM", "CAM"],
          overall: 84,
        },
        {
          name: "A. Tchouaméni",
          team: "Real Madrid",
          positions: ["CDM", "CM", "CB"],
          overall: 84,
        },
        {
          name: "Álex Baena",
          team: "Atlético Madrid",
          positions: ["LM", "ST", "LW"],
          overall: 84,
        },
        {
          name: "L. Martínez",
          team: "Inter",
          positions: ["ST"],
          overall: 88,
        },
        {
          name: "K. Kvaratskhelia",
          team: "Paris Saint-Germain",
          positions: ["LW", "RW", "LM"],
          overall: 87,
        },
        {
          name: "O. Watkins",
          team: "Aston Villa",
          positions: ["ST"],
          overall: 84,
        },
        {
          name: "G. Mamardashvili",
          team: "Liverpool",
          positions: ["GK"],
          overall: 84,
        },
        {
          name: "Ayoze",
          team: "Villarreal CF",
          positions: ["ST", "CAM"],
          overall: 83,
        },
        {
          name: "S. Lobotka",
          team: "Napoli",
          positions: ["CM", "CDM"],
          overall: 83,
        },
        {
          name: "L. Openda",
          team: "Juventus",
          positions: ["ST"],
          overall: 83,
        },
      ],
    },
  },
  {
    name: "Diogo",
    players: {
      create: [
        {
          name: "David Raya",
          team: "Arsenal",
          positions: ["GK"],
          overall: 87,
        },
        {
          name: "W. Saliba",
          team: "Arsenal",
          positions: ["CB"],
          overall: 87,
        },
        {
          name: "H. Çalhanoğlu",
          team: "Inter",
          positions: ["CDM", "CM"],
          overall: 86,
        },
        {
          name: "S. Tonali",
          team: "Newcastle United",
          positions: ["CDM", "CM"],
          overall: 86,
        },
        {
          name: "Iñigo Martínez",
          team: "Al Nassr",
          positions: ["CB"],
          overall: 85,
        },
        {
          name: "João Neves",
          team: "Paris Saint-Germain",
          positions: ["CM", "CDM"],
          overall: 85,
        },
        {
          name: "R. Gravenberch",
          team: "Liverpool",
          positions: ["CDM", "CM"],
          overall: 85,
        },
        {
          name: "E. Palacios",
          team: "Bayer 04 Leverkusen",
          positions: ["CM", "CDM"],
          overall: 84,
        },
        {
          name: "S. McTominay",
          team: "Napoli",
          positions: ["CM", "CAM", "LM"],
          overall: 85,
        },
        {
          name: "A. Isak",
          team: "Liverpool",
          positions: ["ST"],
          overall: 88,
        },
        {
          name: "B. Barcola",
          team: "Paris Saint-Germain",
          positions: ["LW", "RW", "LM"],
          overall: 84,
        },
        {
          name: "Unai Simón",
          team: "Athletic Club",
          positions: ["GK"],
          overall: 85,
        },
        {
          name: "Mikel Merino",
          team: "Arsenal",
          positions: ["CM", "ST"],
          overall: 83,
        },
        {
          name: "L. Torreira",
          team: "Galatasaray SK",
          positions: ["CDM", "CM"],
          overall: 83,
        },
        {
          name: "Gavi",
          team: "FC Barcelona",
          positions: ["CM", "CAM"],
          overall: 83,
        },
        {
          name: "A. Stiller",
          team: "VfB Stuttgart",
          positions: ["CDM", "CM"],
          overall: 83,
        },
      ],
    },
  },
  {
    name: "Daddo",
    players: {
      create: [
        {
          name: "M. Neuer",
          team: "FC Bayern München",
          positions: ["GK"],
          overall: 84,
        },
        {
          name: "A. Davies",
          team: "FC Bayern München",
          positions: ["LB", "LM"],
          overall: 84,
        },
        {
          name: "Rodri",
          team: "Manchester City",
          positions: ["CDM", "CM"],
          overall: 90,
        },
        {
          name: "D. Upamecano",
          team: "FC Bayern München",
          positions: ["CB"],
          overall: 85,
        },
        {
          name: "J. Gvardiol",
          team: "Manchester City",
          positions: ["LB", "CB", "LM"],
          overall: 84,
        },
        {
          name: "Bruno Fernandes",
          team: "Manchester United",
          positions: ["CAM", "CM"],
          overall: 87,
        },
        {
          name: "Sancet",
          team: "Athletic Club",
          positions: ["CAM", "CM", "ST"],
          overall: 84,
        },
        {
          name: "J. Maddison",
          team: "Tottenham Hotspur",
          positions: ["CM", "CAM"],
          overall: 84,
        },
        {
          name: "Rodrygo",
          team: "Real Madrid",
          positions: ["RW", "ST", "RM"],
          overall: 85,
        },
        {
          name: "H. Kane",
          team: "FC Bayern München",
          positions: ["ST"],
          overall: 89,
        },
        {
          name: "O. Marmoush",
          team: "Manchester City",
          positions: ["ST", "CAM", "LW"],
          overall: 84,
        },
        {
          name: "R. Lukaku",
          team: "Napoli",
          positions: ["ST"],
          overall: 84,
        },
        {
          name: "Diogo Costa",
          team: "FC Porto",
          positions: ["GK"],
          overall: 84,
        },
        {
          name: "Aleix García",
          team: "Bayer 04 Leverkusen",
          positions: ["CM", "CDM"],
          overall: 83,
        },
        {
          name: "D. Hancko",
          team: "Atlético Madrid",
          positions: ["CB", "LB", "LM"],
          overall: 83,
        },
        {
          name: "B. Kamara",
          team: "Aston Villa",
          positions: ["CDM", "CM"],
          overall: 83,
        },
      ],
    },
  },
  {
    name: "Reinolds",
    players: {
      create: [
        {
          name: "M. ter Stegen",
          team: "FC Barcelona",
          positions: ["GK"],
          overall: 86,
        },
        {
          name: "B. Pavard",
          team: "Olympique de Marseille",
          positions: ["CB"],
          overall: 84,
        },
        {
          name: "M. Caicedo",
          team: "Chelsea",
          positions: ["CDM", "CM"],
          overall: 87,
        },
        {
          name: "D. Dumfries",
          team: "Inter",
          positions: ["RB", "RM"],
          overall: 84,
        },
        {
          name: "W. Orban",
          team: "RB Leipzig",
          positions: ["CB"],
          overall: 84,
        },
        {
          name: "J. Kimmich",
          team: "FC Bayern München",
          positions: ["CDM", "RB", "CM"],
          overall: 89,
        },
        {
          name: "G. Xhaka",
          team: "Sunderland",
          positions: ["CDM", "CM"],
          overall: 85,
        },
        {
          name: "C. Palmer",
          team: "Chelsea",
          positions: ["CAM", "RM", "ST"],
          overall: 87,
        },
        {
          name: "L. Díaz",
          team: "FC Bayern München",
          positions: ["LM", "LW", "ST"],
          overall: 85,
        },
        {
          name: "J. Alvarez",
          team: "Atlético Madrid",
          positions: ["ST"],
          overall: 87,
        },
        {
          name: "Lamine Yamal",
          team: "FC Barcelona",
          positions: ["RM", "RW"],
          overall: 89,
        },
        {
          name: "A. Lookman",
          team: "Atalanta",
          positions: ["ST", "CAM"],
          overall: 84,
        },
        {
          name: "W. Szczęsny",
          team: "FC Barcelona",
          positions: ["GK"],
          overall: 84,
        },
        {
          name: "S. Mané",
          team: "Al Nassr",
          positions: ["LM", "RM", "ST", "LW"],
          overall: 83,
        },
        {
          name: "E. Eze",
          team: "Arsenal",
          positions: ["CAM", "LW", "ST"],
          overall: 83,
        },
        {
          name: "L. Trossard",
          team: "Arsenal",
          positions: ["LW", "ST", "LM"],
          overall: 83,
        },
      ],
    },
  },
  {
    name: "Guilherme",
    players: {
      create: [
        {
          name: "T. Courtois",
          team: "Real Madrid",
          positions: ["GK"],
          overall: 89,
        },
        {
          name: "Rúben Dias",
          team: "Manchester City",
          positions: ["CB"],
          overall: 86,
        },
        {
          name: "F. Acerbi",
          team: "Inter",
          positions: ["CB"],
          overall: 84,
        },
        {
          name: "S. de Vrij",
          team: "Inter",
          positions: ["CB"],
          overall: 84,
        },
        {
          name: "A. Hakimi",
          team: "Paris Saint-Germain",
          positions: ["RB", "RM"],
          overall: 89,
        },
        {
          name: "A. Rabiot",
          team: "AC Milan",
          positions: ["CAM", "CM"],
          overall: 83,
        },
        {
          name: "P. Dybala",
          team: "Roma",
          positions: ["CAM", "ST"],
          overall: 86,
        },
        {
          name: "N. Kanté",
          team: "Al Ittihad",
          positions: ["CDM", "CM"],
          overall: 85,
        },
        {
          name: "C. Gakpo",
          team: "Liverpool",
          positions: ["LM", "LW"],
          overall: 84,
        },
        {
          name: "K. Benzema",
          team: "Al Ittihad",
          positions: ["ST", "CAM"],
          overall: 85,
        },
        {
          name: "P. Foden",
          team: "Manchester City",
          positions: ["RW", "CM", "LW", "RM"],
          overall: 85,
        },
        {
          name: "K. De Bruyne",
          team: "Napoli",
          positions: ["CM", "CAM"],
          overall: 87,
        },
        {
          name: "A. Sørloth",
          team: "Atlético Madrid",
          positions: ["ST", "RW", "RM"],
          overall: 84,
        },
        {
          name: "M. Kovačić",
          team: "Manchester City",
          positions: ["CM", "CDM", "CAM"],
          overall: 83,
        },
        {
          name: "İ. Gündoğan",
          team: "Galatasaray SK",
          positions: ["CM", "CDM", "CAM"],
          overall: 83,
        },
        {
          name: "A. Dovbyk",
          team: "Roma",
          positions: ["ST"],
          overall: 83,
        },
      ],
    },
  },
  {
    name: "Masio",
    players: {
      create: [
        {
          name: "G. Kobel",
          team: "Borussia Dortmund",
          positions: ["GK"],
          overall: 86,
        },
        {
          name: "F. Dimarco",
          team: "Inter",
          positions: ["LB", "LM"],
          overall: 85,
        },
        {
          name: "A. Rüdiger",
          team: "Real Madrid",
          positions: ["CB"],
          overall: 86,
        },
        {
          name: "F. Valverde",
          team: "Real Madrid",
          positions: ["CM", "CDM", "RB"],
          overall: 89,
        },
        {
          name: "Marcos Llorente",
          team: "Atlético Madrid",
          positions: ["RB", "CM", "RM"],
          overall: 84,
        },
        {
          name: "N. Barella",
          team: "Inter",
          positions: ["CM"],
          overall: 87,
        },
        {
          name: "Bernardo Silva",
          team: "Manchester City",
          positions: ["CM", "RM", "CDM", "CAM"],
          overall: 84,
        },
        {
          name: "M. Locatelli",
          team: "Juventus",
          positions: ["CDM", "CM"],
          overall: 84,
        },
        {
          name: "Raphinha",
          team: "FC Barcelona",
          positions: ["LM", "LW"],
          overall: 89,
        },
        {
          name: "H. Son",
          team: "Los Angeles FC",
          positions: ["LW", "ST", "LM"],
          overall: 85,
        },
        {
          name: "D. Doué",
          team: "Paris Saint-Germain",
          positions: ["RW", "LW", "CM", "RM"],
          overall: 85,
        },
        {
          name: "P. Gulácsi",
          team: "RB Leipzig",
          positions: ["GK"],
          overall: 85,
        },
        {
          name: "H. Mkhitaryan",
          team: "Inter",
          positions: ["CM"],
          overall: 83,
        },
        {
          name: "L. Modrić",
          team: "AC Milan",
          positions: ["CM", "CAM", "CDM"],
          overall: 83,
        },
        {
          name: "J. Bowen",
          team: "West Ham United",
          positions: ["RM", "ST", "RW"],
          overall: 83,
        },
        {
          name: "Ferran Torres",
          team: "FC Barcelona",
          positions: ["LW", "RW", "ST", "LM"],
          overall: 83,
        },
      ],
    },
  },
  {
    name: "Eike",
    players: {
      create: [
        {
          name: "M. Maignan",
          team: "AC Milan",
          positions: ["GK"],
          overall: 87,
        },
        {
          name: "Marquinhos",
          team: "Paris Saint-Germain",
          positions: ["CB"],
          overall: 87,
        },
        {
          name: "A. Mac Allister",
          team: "Liverpool",
          positions: ["CM", "CDM"],
          overall: 87,
        },
        {
          name: "T. Alexander-Arnold",
          team: "Real Madrid",
          positions: ["RB", "RM"],
          overall: 86,
        },
        {
          name: "Carvajal",
          team: "Real Madrid",
          positions: ["RB", "RM"],
          overall: 85,
        },
        {
          name: "E. Fernández",
          team: "Chelsea",
          positions: ["CM", "CDM", "CAM"],
          overall: 84,
        },
        {
          name: "Dani Olmo",
          team: "FC Barcelona",
          positions: ["CAM", "CM", "ST"],
          overall: 85,
        },
        {
          name: "R. De Paul",
          team: "Inter Miami",
          positions: ["CM", "CDM", "CAM"],
          overall: 84,
        },
        {
          name: "Grimaldo",
          team: "Bayer 04 Leverkusen",
          positions: ["LM", "LB", "LW"],
          overall: 84,
        },
        {
          name: "S. Guirassy",
          team: "Borussia Dortmund",
          positions: ["ST"],
          overall: 87,
        },
        {
          name: "R. Mahrez",
          team: "Al Ahli SFC",
          positions: ["RM", "RW"],
          overall: 84,
        },
        {
          name: "Isco",
          team: "Real Betis Balompié",
          positions: ["CAM", "LM", "CM"],
          overall: 84,
        },
        {
          name: "M. Carnesecchi",
          team: "Atalanta",
          positions: ["GK"],
          overall: 84,
        },
        {
          name: "M. Hjulmand",
          team: "Sporting CP",
          positions: ["CDM", "CM"],
          overall: 83,
        },
        {
          name: "Ronaldo Cabrais",
          team: "Botafogo",
          positions: ["CAM", "RM", "CM"],
          overall: 83,
        },
        {
          name: "N. Aké",
          team: "Manchester City",
          positions: ["CB", "LB", "LM"],
          overall: 83,
        },
      ],
    },
  },
  {
    name: "Anderson",
    players: {
      create: [
        {
          name: "Y. Sommer",
          team: "Inter",
          positions: ["GK"],
          overall: 87,
        },
        {
          name: "Gabriel",
          team: "Arsenal",
          positions: ["CB"],
          overall: 88,
        },
        {
          name: "A. Bastoni",
          team: "Inter",
          positions: ["CB"],
          overall: 87,
        },
        {
          name: "I. Konaté",
          team: "Liverpool",
          positions: ["CB"],
          overall: 86,
        },
        {
          name: "N. Schlotterbeck",
          team: "Borussia Dortmund",
          positions: ["CB"],
          overall: 85,
        },
        {
          name: "Bruno Guimarães",
          team: "Newcastle United",
          positions: ["CM", "CDM"],
          overall: 86,
        },
        {
          name: "Y. Tielemans",
          team: "Aston Villa",
          positions: ["CM", "CDM", "CAM"],
          overall: 85,
        },
        {
          name: "Rúben Neves",
          team: "Al Hilal",
          positions: ["CDM", "CM"],
          overall: 84,
        },
        {
          name: "B. Mbeumo",
          team: "Manchester United",
          positions: ["RW", "RM", "ST"],
          overall: 85,
        },
        {
          name: "V. Osimhen",
          team: "Galatasaray SK",
          positions: ["ST"],
          overall: 87,
        },
        {
          name: "Rafael Leão",
          team: "AC Milan",
          positions: ["LW", "LM"],
          overall: 84,
        },
        {
          name: "C. Pulisic",
          team: "AC Milan",
          positions: ["RW", "RM", "CAM"],
          overall: 84,
        },
        {
          name: "D. Szoboszlai",
          team: "Liverpool",
          positions: ["CAM", "CM"],
          overall: 83,
        },
        {
          name: "D. Kulusevski",
          team: "Tottenham Hotspur",
          positions: ["CM", "RW", "CAM"],
          overall: 83,
        },
        {
          name: "T. Partey",
          team: "Villarreal CF",
          positions: ["CDM", "CM", "RB"],
          overall: 83,
        },
        {
          name: "Palhinha",
          team: "Tottenham Hotspur",
          positions: ["CDM", "CM"],
          overall: 83,
        },
      ],
    },
  },
  {
    name: "Guga",
    players: {
      create: [
        {
          name: "Ederson",
          team: "Fenerbahçe SK",
          positions: ["GK"],
          overall: 85,
        },
        {
          name: "Balde",
          team: "FC Barcelona",
          positions: ["LB", "LM"],
          overall: 83,
        },
        {
          name: "W. Pacho",
          team: "Paris Saint-Germain",
          positions: ["CB"],
          overall: 86,
        },
        {
          name: "Éder Militão",
          team: "Real Madrid",
          positions: ["CB"],
          overall: 84,
        },
        {
          name: "J. Frimpong",
          team: "Liverpool",
          positions: ["RB", "RM", "RW"],
          overall: 83,
        },
        {
          name: "T. Reijnders",
          team: "Manchester City",
          positions: ["CM", "CDM", "CAM"],
          overall: 86,
        },
        {
          name: "F. de Jong",
          team: "FC Barcelona",
          positions: ["CM", "CDM"],
          overall: 87,
        },
        {
          name: "X. Simons",
          team: "Tottenham Hotspur",
          positions: ["CAM", "LM", "ST"],
          overall: 84,
        },
        {
          name: "Nico Williams",
          team: "Athletic Club",
          positions: ["LM", "RM", "LW"],
          overall: 86,
        },
        {
          name: "V. Gyökeres",
          team: "Arsenal",
          positions: ["ST"],
          overall: 87,
        },
        {
          name: "M. Zaccagni",
          team: "Lazio",
          positions: ["LM", "LW"],
          overall: 84,
        },
        {
          name: "M. Diaby",
          team: "Al Ittihad",
          positions: ["RM", "RW"],
          overall: 84,
        },
        {
          name: "J. Pickford",
          team: "Everton",
          positions: ["GK"],
          overall: 84,
        },
        {
          name: "Iñaki Williams",
          team: "Athletic Club",
          positions: ["RM", "ST", "RW"],
          overall: 83,
        },
        {
          name: "Zubimendi",
          team: "Arsenal",
          positions: ["CDM", "CM"],
          overall: 83,
        },
        {
          name: "Murillo",
          team: "Nottingham Forest",
          positions: ["CB"],
          overall: 83,
        },
      ],
    },
  },
]

async function seedParticipant(
  participant: Prisma.ParticipantCreateInput,
) {
  const name = participant.name
  if (!name) throw new Error("Participant name is required")

  const upsertedParticipant = await prisma.participant.upsert({
    where: { name },
    update: {},
    create: { name },
  })

  const players = participant.players
  if (!players?.create) throw new Error(`No players for participant ${name}`)

  const playerList = Array.isArray(players.create) ? players.create : [players.create]

  for (const player of playerList) {
    if (typeof player === "object" && player !== null && "name" in player) {
      const playerName = player.name
      await prisma.player.upsert({
        where: {
          participantId_name: {
            participantId: upsertedParticipant.id,
            name: playerName,
          },
        },
        update: {
          team: player.team,
          positions: player.positions ?? [],
          overall: player.overall,
        },
        create: {
          name: playerName,
          team: player.team,
          positions: player.positions ?? [],
          overall: player.overall,
          participantId: upsertedParticipant.id,
        },
      })
    }
  }
}

async function main() {
  for (const data of participantData) {
    await seedParticipant(data)
  }

  const participantCount = await prisma.participant.count()
  const playerCount = await prisma.player.count()
  console.log(
    `Seed complete: ${participantCount} participants, ${playerCount} players`,
  )
}

main()
  .catch(async (error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

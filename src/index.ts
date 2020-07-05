import express from "express";
import bodyParser from "body-parser";
import mime from "mime-types";
import stream from "memorystream";
import logger from "morgan";
import fetch from "node-fetch";
import ytdl from "ytdl-core";
import ytsr from "ytsr";
import Ffmpeg from "fluent-ffmpeg";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";

import { config } from "dotenv";
import { twiml } from "twilio";

import twilio from "./twilio";

import { ITwilioRequest, ITwilioStatus } from "./typing";
import { cleanMetaData as fixMetadata } from "./helpers";
import { ytHeaders } from "./request";
import { getMessages } from "./strings";
import { acrCloudClient } from "./acrCloud";

// Load env variables
config();

const youtubeRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;

// Setup Express
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(logger("dev"));

const youtubeCache = new Map<String, ytdl.videoInfo>();

app.get("/:youtubeID", async (req, res) => {
  const { youtubeID } = req.params;

  if (!youtubeID.match(/([^"&?\/\s]{11})/)) {
    return res.end("youtube id is invalid");
  }

  const youtubeUrl = `https://youtube.com/watch?v=${youtubeID}`;

  const info =
    youtubeCache.get(youtubeID) ||
    <ytdl.videoInfo>(
      youtubeCache.set(youtubeID, await ytdl.getInfo(youtubeUrl)).get(youtubeID)
    );

  let filteredFormats = info.formats.filter((format) => format.itag == 140);

  if (filteredFormats.length <= 0) {
    filteredFormats = info.formats.filter(
      (format) => format.itag == 250 || format.itag == 251 || format.itag == 249
    );
    if (filteredFormats.length <= 0) return res.end();
  }

  const toDownload = filteredFormats[0];

  const title = fixMetadata(info.media?.song || info.title);
  const artist = fixMetadata(info.media?.artist || info.author?.name);
  const album = fixMetadata(info.media?.category || "Single");

  const metadata = [
    "-metadata",
    `title=${title}`,
    "-metadata",
    `artist=${artist}`,
    "-metadata",
    `album=${album}`,
  ];

  res.setHeader("Content-Type", mime.lookup("mp3").toString());
  res.setHeader("Content-Disposition", `attachment; filename="${title}.mp3"`);
  const video = (
    await fetch(toDownload.url, {
      headers: ytHeaders,
    })
  ).body;
  const videoStream = new stream();
  video.pipe(<any>videoStream);
  const ffmpegStream = Ffmpeg()
    .input(videoStream)
    .inputFormat(toDownload.container)
    .withAudioCodec("libshine")
    .outputFormat("mp3")
    .outputOptions(metadata)
    .on("start", function (cmd) {
      console.log("Started " + cmd);
    })
    .on("error", function (err) {
      console.log("An error occurred: " + err.message);
      ffmpegStream.end();
    })
    .on("end", function () {
      console.log("Finished encoding");
    })
    .pipe(res);
});

app.get("/:some?", (_, res) => {
  res.end("Hi, and bye!");
});

app.post("/", async (req, res) => {
  const twilioReq: ITwilioRequest = req.body;

  const rec = await respondToMessage(twilioReq);

  res.writeHead(200, {
    "content-type": "application/xml",
  });

  res.end(rec.toString());
});

app.post("/status", async (req, res) => {
  const status: ITwilioStatus = req.body;

  if (status.ErrorCode) {
    twilio.messages.create({
      from: status.From,
      to: status.To,
      body: getMessages(status.To).songFailed(),
    });
  }

  res.end();
});

const respondToMessage = async (
  twilioReq: ITwilioRequest
): Promise<MessagingResponse> => {
  const rec = new twiml.MessagingResponse();
  const messageBody = twilioReq.Body;

  console.log(twilioReq);

  if (messageBody && messageBody.startsWith("$song")) {
    const songName = messageBody
      .split(" ")
      .filter((e) => e != "$song")
      .join(" ")
      .trim();

    console.log("SongName: ", songName);
    const searchResults = (await ytsr(songName)).items.filter(
      (e) => e.type == "video"
    );
    if (searchResults.length > 0) {
      const first = searchResults[0];

      // fill the cache so next request will be fast!
      ytdl.getInfo(first.link).then((videInfo) => {
        youtubeCache.set(videInfo.video_id, videInfo);
      });

      // Message for wait
      rec.message(getMessages(twilioReq.From).songInQueue(first.title));

      const ytID = first.link.match(youtubeRegex)?.[5] || "";

      // media message
      const msg = rec.message("Your song is here.");
      msg.media(process.env.BASE_URL + ytID);
    } else {
      rec.message("No result for your song, too sad! :(");
    }
  } else if (parseInt(twilioReq.NumMedia) > 0) {
    const mediaUrl = twilioReq.MediaUrl0;
    const media = await (await fetch(mediaUrl)).buffer();
    const data = await acrCloudClient.identify(media);
    if (data?.status?.msg == "Success") {
      const musicInfo = data.metadata.music?.[0];
      rec.message(
        `Media found...\n*${musicInfo?.title}* by *${musicInfo?.artists
          ?.map((e: any) => e.name)
          .join(", ")
          .replace(";", ", ")}*`
      );
    } else {
      rec.message(
        "I tried to find that the thing you sent..But bruh..Didn't find a thing? Sorry!"
      );
    }
  }

  return rec;
};

app.listen(process.env.PORT || 3000, () => console.log("Started server"));

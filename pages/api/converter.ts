// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { exec } from 'child_process';
import formidable from 'formidable';
import { createReadStream } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';

import path from 'path/posix';
import { env } from 'process';

type FormidableResult = {
  err: string;
  fields: formidable.Fields;
  files: formidable.Files;
};

export const config = {
  api: {
    bodyParser: false,
    ResponseLimit : false
  },
};

const apikey = env.APIKEY;
const allowedMethod = ["GET", "POST"];
const supportedExt = [".abc", ".blend", ".dae", ".fbx", ".obj", ".ply", ".stl", ".usd", ".wrl", ".x3d"]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!allowedMethod.includes(req.method ?? "")) {
    res.status(405).end();
    return;
  }
  
  if(req.method === "GET") {
    const msg = await executeConvertor("hello.dae").catch(rej=>res.status(503).end(rej));
    res.status(200).end(msg)
    return;
  }

  if(req.method === "POST") {
    const formidable = await getFormidableFileFromReq(req, {
      multiples: true,
      maxFileSize: 150 << 20,
      keepExtensions: true,
    });
    const files = makeMaybeArrayToArray<formidable.File>(
      formidable.files.file
    );
    const convedFile = await executeConvertor(files[0].filepath);
    const stream = createReadStream(convedFile);
    stream.pipe(res);
    return ;
  }
}

async function executeConvertor(filePath : string) {
  if(!supportedExt.includes(path.extname(filePath))){
    throw Error("Not supported type.")
  }
  
  await execute(`sh exec/convert.sh ${filePath}`)
  const convertedFile = path.basename(filePath).split('.').slice(0,-1).join('.') + ".glb";
  await execute(`mv ${convertedFile} /tmp`)
  return `/tmp/${convertedFile}`
}

async function execute(command : string) {
  return new Promise((res,rej)=>{
    exec(command, (error, stdout, stderr)=>{
      if(error){
        rej(error);
        return;
      }
      res({stdout, stderr});
    })
  })
}

const getFormidableFileFromReq = async (
  req: NextApiRequest,
  options?: formidable.Options
) => {
  return await new Promise<FormidableResult>((res, rej) => {
    const form = formidable(
      options ?? {
        multiples: true,
        maxFileSize: 150 << 20, // 100MB for zip file
        keepExtensions: true,
      }
    );
    form.parse(req, (err: Error, fields, files) => {
      if (err) {
        return rej(err);
      }
      return res({ err, fields, files });
    });
  });
};

function makeMaybeArrayToArray<T>(target: T | T[]) {
  if (!(target instanceof Array)) {
    return [target];
  } else {
    return target;
  }
}
import { statSync, createReadStream as CRS } from "fs";
import { serveStatic as serve } from 'hono/bun';
import { CSP, read, dir, log } from "./utils";
import { vStats } from "./video";
import { resolve } from "path";
import { Hono } from 'hono';

const app = new Hono()
  .use( '/app/*', serve( { root: './' } ) )

app
  .get( '/video/:id', ( c ) => {
    const { id } = c.req.param();
    const filepath = resolve( "video/" + id );
    console.log( filepath );
    const fileSize = statSync( filepath )?.size;

    const range = c.req.headers.range;

    let headers, stream;
    if ( range ) {
      const { start, end, c_len } = vStats( range, fileSize );
      headers = new Headers( {
        "Content-Range": `bytes ${ start }-${ end }/${ fileSize }`,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Content-Length": c_len
      } );
      stream = CRS( filepath, { start, end } );
    } else {
      headers = new Headers( {
        "Content-Type": "video/mp4",
        "Content-Length": fileSize,
      } );
      stream = CRS( filepath );
    }

    c.status( 206 );
    c.header( headers );
    return stream.pipe( c.res )
  } );

app
  .post( '/track/:id', async ( c ) => {
    const { id } = c.req.param();
    const body = await c.req.text();

    log( id + " " + body );
    return c.text( "ok" );
  } );

export default app;
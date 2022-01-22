import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v0.1.0/types.ts#^";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v0.1.0/deps.ts#^";
import { join, resolve } from "https://deno.land/std@0.120.0/path/mod.ts";

type ActionData = {
  path?: string;
  bufNr?: number;
  lineNr?: number;
  col?: number;
};

type Params = {
  path: string;
};

export class Source extends BaseSource<Params> {
  kind = "file";

  gather(args: {
    denops: Denops;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const maxItems = 20000;

        const tree = async (root: string) => {
          let items: Item<ActionData>[] = [];
          for await (const entry of Deno.readDir(root)) {
            const path = join(root, entry.name);
            items.push({
              word: path,
              action: {
                path: path,
              },
            });

            if (items.length > maxItems) {
              // Update items
              controller.enqueue(items);

              // Clear
              items = [];
            }
          }

          return items;
        };

        let dir = args.sourceParams.path;
        if (dir == "") {
          dir = await fn.getcwd(args.denops) as string;
        }

        controller.enqueue(
          await tree(resolve(dir, dir)),
        );

        controller.close();
      },
    });
  }

  params(): Params {
    return {
      path: "",
    };
  }
}
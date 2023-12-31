
namespace FilaCapacitor
{
	/** */
	export const enum Directory
	{
		cache = "CACHE",
		data = "DATA",
		documents = "DOCUMENTS",
		external = "EXTERNAL",
		externalStorage = "EXTERNAL_STORAGE",
		library = "LIBRARY",
	}
	
	/** */
	export type TDirectory = import("@capacitor/filesystem").Directory;
	
	/** */
	export async function use()
	{
		const cwd = Directory.data;
		const tmp = Directory.cache;
		const sep = "/";
		
		/** */
		class FilaCapacitor extends Fila
		{
			/** */
			static _ = (() =>
			{
				Fila.setDefaults(FilaCapacitor, sep, cwd, tmp);
			})();
			
			/** */
			private get fs()
			{
				const g = globalThis as any;
				const fs = g.Capacitor?.Plugins?.Filesystem;
				if (!fs)
					throw new Error("Filesystem plugin not added to Capacitor.");
				
				return fs as typeof import("@capacitor/filesystem").Filesystem;
			}
			
			/**
			 * Gets the fully-qualified path, including any file name to the
			 * file system object being represented by this Fila object.
			 */
			get path()
			{
				return Fila.join(...this.components);
			}
			
			/** */
			async readText()
			{
				const result = await this.fs.readFile({
					...this.getDefaultOptions(),
					encoding: "utf8" as any
				});
				
				return result.data;
			}
			
			/** */
			async readBinary()
			{
				const result = await this.fs.readFile({
					...this.getDefaultOptions(),
					encoding: "ascii" as any
				});
				
				const base64 = result.data;
				return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
			}
			
			/** */
			async readDirectory()
			{
				const result = await this.fs.readdir(this.getDefaultOptions());
				const filas: Fila[] = [];
				
				for (const file of result.files)
					if (file.name !== ".DS_Store")
						filas.push(Fila.new(this.path, file.name || ""));
				
				return filas;
			}
			
			/** */
			async writeText(text: string, options?: Fila.IWriteTextOptions)
			{
				try
				{
					const up = this.up();
					if (!await up.exists())
						await up.writeDirectory();
					
					const writeOptions = {
						...this.getDefaultOptions(),
						data: text,
						encoding: "utf8" as any
					};
					
					if (options?.append)
						await this.fs.appendFile(writeOptions);
					else
						await this.fs.writeFile(writeOptions);
				}
				catch (e)
				{
					console.error("Write failed to path: " + this.path);
					debugger;
				}
			}
			
			/** */
			async writeBinary(arrayBuffer: ArrayBuffer)
			{
				await this.up().writeDirectory();
				const data = await this.arrayBufferToBase64(arrayBuffer);
				await this.fs.writeFile({
					...this.getDefaultOptions(),
					data,
					encoding: "ascii" as any
				});
			}
			
			/** */
			private arrayBufferToBase64(buffer: ArrayBuffer)
			{
				return new Promise<string>(r =>
				{
					const blob = new Blob([buffer], { type: "application/octet-binary" });
					const reader = new FileReader();
					
					reader.onload = ev =>
					{
						const dataUrl = (ev.target?.result || "") as string;
						const slice = dataUrl.slice(dataUrl.indexOf(`,`) + 1);
						r(slice);
					};
					reader.readAsDataURL(blob);
				});
			}
			
			/** */
			async writeDirectory()
			{
				await this.fs.mkdir({
					...this.getDefaultOptions(),
					recursive: true
				});
			}
			
			/**
			 * Writes a symlink file at the location represented by the specified
			 * Fila object, to the location specified by the current Fila object.
			 */
			async writeSymlink(at: Fila)
			{
				throw new Error("Not implemented");
			}
			
			/**
			 * Deletes the file or directory that this Fila object represents.
			 */
			async delete(): Promise<Error | void>
			{
				if (await this.isDirectory())
				{
					return new Promise<Error | void>(async r =>
					{
						await this.fs.rmdir({
							...this.getDefaultOptions(),
							recursive: true
						});
						
						r();
					});
				}
				
				await this.fs.deleteFile(this.getDefaultOptions());
			}
			
			/** */
			async move(target: Fila)
			{
				throw new Error("Not implemented.");
			}
			
			/** */
			async copy(target: Fila)
			{
				const fromOptions = this.getDefaultOptions();
				const toOptions = this.getDefaultOptions(target.path);
				
				await this.fs.copy({
					from: fromOptions.path,
					directory: fromOptions.directory,
					to: toOptions.path,
					toDirectory: toOptions.directory,
				});
			}
			
			/** */
			async rename(newName: string)
			{
				const target = this.up().down(newName).path;
				const fromOptions = this.getDefaultOptions();
				const toOptions = this.getDefaultOptions(target);
				
				await this.fs.rename({
					from: this.path,
					directory: fromOptions.directory,
					to: target,
					toDirectory: toOptions.directory
				});
			}
			
			/** */
			protected watchProtected(
				recursive: boolean,
				callbackFn: (event: Fila.Event, fila: Fila) => void): () => void
			{
				throw new Error("Not implemented");
			}
			
			/** */
			async exists()
			{
				return !!await this.getStat();
			}
			
			/** */
			async getSize()
			{
				return (await this.getStat())?.size || 0;
			}
			
			/** */
			async getModifiedTicks()
			{
				return (await this.getStat())?.mtime || 0;
			}
			
			/** */
			async getCreatedTicks()
			{
				return (await this.getStat())?.ctime || 0;
			}
			
			/** */
			async getAccessedTicks()
			{
				return 0;
			}
			
			/** */
			async isDirectory()
			{
				return (await this.getStat())?.type === "directory";
			}
			
			/** */
			private async getStat()
			{
				try
				{
					return await this.fs.stat(this.getDefaultOptions());
				}
				catch (e) { return null; }
			}
			
			/** */
			private getDefaultOptions(targetPath: string = this.path)
			{
				const slash = targetPath.indexOf("/");
				let path = "";
				let directory = "";
				
				if (slash < 0)
				{
					path = targetPath;
					directory = Directory.cache as any as TDirectory;
				}
				else
				{
					path = targetPath.slice(slash + 1);
					directory = targetPath.slice(0, slash) as TDirectory;
				}
				
				const result = {
					path,
					directory: directory as TDirectory
				};
				
				return result;
			}
		}
	}
}

//@ts-ignore CommonJS compatibility
typeof module === "object" && Object.assign(module.exports, { FilaCapacitor });

// ES module compatibility
declare module "fila-capacitor"
{
	const __export: { FilaCapacitor: typeof FilaCapacitor };
	export = __export;
}

// The comment and + prefix is removed during npm run bundle
//+ export { FilaCapacitor }
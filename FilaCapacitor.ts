
class FilaCapacitor extends Fila
{
	/** */
	static async use()
	{
		const directory = {} as typeof import("@capacitor/filesystem").Directory;
		const cwd = directory.Data;
		const tmp = directory.Cache;
		const sep = "/";
		Fila.setDefaults(FilaCapacitor, sep, cwd, tmp);
	}
	
	/** */
	private readonly fs: typeof import("@capacitor/filesystem").Filesystem = {} as any;
	
	/** */
	async readText()
	{
		const result = await this.fs.readFile({
			path: this.path,
			encoding: "utf8" as any
		});
		
		return result.data;
	}
	
	/** */
	async readBinary()
	{
		const result = await this.fs.readFile({ path: this.path });
		const base64 = result.data;
		return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
	}
	
	/** */
	async readDirectory()
	{
		const result = await this.fs.readdir({ path: this.path });
		const filas: Fila[] = [];
		
		for (const file of result.files)
			if (file.name !== ".DS_Store")
				filas.push(Fila.new(this.path, file.name || ""));
		
		return filas;
	}
	
	/** */
	async writeText(text: string)
	{
		try
		{
			const up = this.up();
			if (!await up.exists())
				await up.writeDirectory();
			
			await this.fs.writeFile({
				path: this.path,
				data: text
			});
		}
		catch (e)
		{
			debugger;
		}
	}
	
	/** */
	async writeBinary(arrayBuffer: ArrayBuffer)
	{
		await this.up().writeDirectory();
		const data = await this.arrayBufferToBase64(arrayBuffer);
		await this.fs.writeFile({ path: this.path, data });
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
			path: this.path,
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
					path: this.path,
					recursive: true
				});
				
				r();
			});
		}
		
		await this.fs.deleteFile({ path: this.path });
	}
	
	/** */
	move(target: Fila)
	{
		return null as any;
	}
	
	/** */
	async copy(target: Fila)
	{
		await this.fs.copy({
			from: this.path,
			to: target.path
		});
	}
	
	/** */
	async rename(newName: string)
	{
		const target = this.up().down(newName).path;
		await this.fs.rename({
			from: this.path,
			to: target
		});
	}
	
	/** */
	protected watchProtected(recursive: boolean, callbackFn: (event: Fila.Event, fila: Fila) => void): () => void
	{
		throw new Error("Not implemented");
	}
	
	/** */
	async exists()
	{
		const stat = await this.getStat()
		debugger;
		return true;
	}
	
	/** */
	async getSize()
	{
		return (await this.getStat()).size;
	}
	
	/** */
	async getModifiedTicks()
	{
		return (await this.getStat()).mtime;
	}
	
	/** */
	async getCreatedTicks()
	{
		return (await this.getStat()).ctime || 0;
	}
	
	/** */
	async getAccessedTicks()
	{
		return 0;
	}
	
	/** */
	async isDirectory()
	{
		return (await this.getStat()).type === "directory";
	}
	
	/** */
	private async getStat()
	{
		return await this.fs.stat({ path: this.path });
	}
}

typeof module === "object" && Object.assign(module.exports, { FilaCapacitor });
type Input = {
	id: string;
};

export default async (data: Input) => {
	console.log('ok', data);
	// await db.insert(videos).values({
	//   id: data.id,
	//   name: data.name,
	//   description: data.description,
	//   format: data.format
	// });
};

import { Label } from './ui/label'
import { v4 as uuidv4 } from 'uuid'
import { Button } from './ui/button'
import { Loader } from 'lucide-react'
import React, { useState } from 'react'
import { Textarea } from './ui/textarea'
import { useToast } from "@/hooks/use-toast"
import { api } from '@/convex/_generated/api'
import { GeneratePodcastProps } from '@/types'
import { generateUploadUrl } from '@/convex/files'
import { useAction, useMutation } from 'convex/react'
import { useUploadFiles } from '@xixixao/uploadstuff/react';


const useGeneratePodcast = ({
    setAudio, voiceType, voicePrompt, setAudioStorageId
}: GeneratePodcastProps) => {
    const { toast } = useToast()

    const [isGenerating, setIsGenerating] = useState(false);

    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const { startUpload } = useUploadFiles(generateUploadUrl)

    const getPodcastAudio = useAction(api.openai.generateAudioAction);

    const getAudioUrl = useMutation(api.podcasts.getUrl);

    const generatePodcast = async () => {
        // Logic for generating podcast
        setIsGenerating(true);
        setAudio('');

        if (!voicePrompt) {
            toast({
                title: "Please provide a voiceType to generate a podcast",
            })
            return setIsGenerating(false);
        }
        try {
            const response = await getPodcastAudio({
                voice: voiceType,
                input: voicePrompt
            })

            const blob = new Blob([response], { type: 'audio/mpeg' });
            const fileName = `podcast-${uuidv4()}.mp3`;
            const file = new File([blob], fileName, { type: 'audio/mpeg' });

            const uploaded = await startUpload([file]);
            const storageId = (uploaded[0].response as any).storageId;

            setAudioStorageId(storageId);

            const audioUrl = await getAudioUrl({ storageId });
            setAudio(audioUrl!);
            setIsGenerating(false);

            toast({
                title: "Podcast generated successfully",
            })
        } catch (error) {
            toast({
                title: "Error creating a podcast",
                variant: 'destructive'

            })
            console.error('Error Generating Podcast', error)
        }
    }

    return { isGenerating, generatePodcast }
}

const GeneratePodcast = (props: GeneratePodcastProps) => {

    const { isGenerating, generatePodcast } = useGeneratePodcast(props);

    return (
        <div>
            <div className='flex flex-col gap-2.5'>
                <Label className='text-16 font-bold text-white-1'>
                    AI prompt to Generate Podcast
                </Label>
                <Textarea className='input-class font-light
                focus-visible:ring-offset-orange-1'
                    placeholder='Provide text to generate audio'
                    rows={5}
                    value={props.voicePrompt}
                    onChange={(e) => props.setVoicePrompt(e.target.value)}
                />
            </div>
            <div className='mt-5 w-full max-2-[200px]'>
                <Button type="submit"
                    className='text-16  bg-orange-1 py-4 font-bold text-white-1 transition-all '
                    onClick={generatePodcast}>
                    {isGenerating ? (
                        <>
                            <Loader size={20} className='animate-spin ml-2' />
                            Generating
                        </>
                    ) : 'Generate'}
                </Button>
            </div>
            {props.audio && (
                <audio
                    controls
                    src={props.audio}
                    autoPlay
                    className='mt-5'
                    onLoadedMetadata={(e) => props.setAudioDuration(e.currentTarget.duration)}
                />
            )}
        </div>
    )
}

export default GeneratePodcast
if($Host.UI.RawUI.WindowTitle -like "*administrator*")
{
	$Host.UI.RawUI.ForegroundColor = "Red"
}

function unzipFile($file, $destination)
{
$shell = new-object -com shell.application
$zip = $shell.NameSpace($file)
foreach($item in $zip.items())
{
$shell.Namespace($destination).copyhere($item)
}
}



IMPLEMENTATION:
unzipFile –File “C:\zippedFile.zip” –Destination “C:\temp\zippedFile”




ADD TO POWERSHELL PROFILE:
http://www.howtogeek.com/126469/how-to-create-a-powershell-profile/